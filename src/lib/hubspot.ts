import { Deal, DealContact, DealNote, DealTask, DealEmail, DealMeeting, DealCall, PipelineStage } from './types';
import { getCustomTagsMap, saveCustomTag } from './tags';
import { getAlignedStoriesMap } from './aligned';

const HUBSPOT_BASE_URL = 'https://api.hubapi.com';
const TOKEN = process.env.HUBSPOT_ACCESS_TOKEN || '';
const OWNER_ID = process.env.HUBSPOT_OWNER_ID || '75550922';

export const STAGE_LABELS: Record<string, string> = {
  // Default sales pipeline
  '1209215206': 'Meeting Booked',
  'presentationscheduled': 'Meeting Held',
  '1465977055': 'Upside',
  '1965601015': 'Expected to close',
  'decisionmakerboughtin': 'Committed',
  'contractsent': 'Contract Sent',
  'closedwon': 'Closed Won',
  'closedlost': 'Closed Lost',
  '1352329432': 'No Response - After Meeting',
  '2594016461': 'Re-Engage Pipeline Helm',
  '3043628233': 'Re-Engage Pipeline Voila',
  '3043628234': 'Re-Engage Pipeline Neuro',
  'qualifiedtobuy': 'Qualified To Buy',
  // Back Burning / Other
  '5536133318': 'Back Burner',
  '5030008022': 'Evaluation / Follow-up',
  '1638150379': 'Proposal / Active Review',
};

export async function fetchPipelineStages(): Promise<Record<string, string>> {
  if (!TOKEN) return STAGE_LABELS;
  try {
    const res = await fetch(`${HUBSPOT_BASE_URL}/crm/v3/pipelines/deals`, {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
      },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return STAGE_LABELS;
    const data = await res.json();
    const map: Record<string, string> = { ...STAGE_LABELS };
    data.results?.forEach((pipe: any) => {
      pipe.stages?.forEach((stage: any) => {
        map[stage.id] = stage.label;
      });
    });
    return map;
  } catch (err) {
    console.error('Error fetching pipeline stages:', err);
    return STAGE_LABELS;
  }
}

export async function getOpenDeals(): Promise<Deal[]> {
  if (!TOKEN) throw new Error('HUBSPOT_ACCESS_TOKEN is not configured.');

  const stageLabels = await fetchPipelineStages();

  const body = {
    filters: [
      {
        propertyName: 'hubspot_owner_id',
        operator: 'EQ',
        value: OWNER_ID,
      },
      {
        propertyName: 'dealstage',
        operator: 'NEQ',
        value: 'closedlost',
      },
      {
        propertyName: 'dealstage',
        operator: 'NEQ',
        value: 'closedwon',
      },
    ],
    properties: [
      'dealname',
      'amount',
      'dealstage',
      'pipeline',
      'closedate',
      'hs_lastmodifieddate',
      'notes_last_contacted',
      'notes_last_updated',
      'hs_latest_meeting_activity',
      'hs_sales_email_last_replied',
      'hubspot_owner_id',
      'source',
      'sub_source',
      'createdate',
    ],
    limit: 100,
    sorts: [
      {
        propertyName: 'hs_lastmodifieddate',
        direction: 'DESCENDING',
      },
    ],
  };

  const response = await fetch(`${HUBSPOT_BASE_URL}/crm/v3/objects/deals/search`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HubSpot API failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const allResults = data.results || [];
  const now = new Date().getTime();

  // Strictly filter out ANY Closed Lost deals
  const rawDeals = allResults.filter((item: any) => {
    const stageId = (item.properties?.dealstage || '').toLowerCase();
    const stageLabel = (stageLabels[stageId] || STAGE_LABELS[stageId] || '').toLowerCase();
    if (stageId === 'closedlost' || stageId.includes('lost') || stageLabel.includes('lost')) {
      return false;
    }
    return true;
  });

  // Batch fetch task and meeting associations for all deals to check for planned follow-ups
  const dealTaskMap: Record<string, any[]> = {};
  const dealMeetingMap: Record<string, any[]> = {};

  try {
    if (rawDeals.length > 0) {
      // 1. Fetch Task Associations
      const assocRes = await fetch(`${HUBSPOT_BASE_URL}/crm/v4/associations/deals/tasks/batch/read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputs: rawDeals.map((d: any) => ({ id: d.id })) }),
      });
      if (assocRes.ok) {
        const assocData = await assocRes.json();
        const allTaskInputs: { id: string }[] = [];
        const taskToDealMap: Record<string, string> = {};

        (assocData.results || []).forEach((r: any) => {
          const dealId = r.from.id;
          (r.to || []).forEach((t: any) => {
            const taskId = t.toObjectId.toString();
            allTaskInputs.push({ id: taskId });
            taskToDealMap[taskId] = dealId;
          });
        });

        if (allTaskInputs.length > 0) {
          const tasksRes = await fetch(`${HUBSPOT_BASE_URL}/crm/v3/objects/tasks/batch/read`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              inputs: allTaskInputs.slice(0, 100),
              properties: ['hs_task_subject', 'hs_task_status', 'hs_timestamp'],
            }),
          });
          if (tasksRes.ok) {
            const tasksData = await tasksRes.json();
            (tasksData.results || []).forEach((taskItem: any) => {
              const taskId = taskItem.id;
              const dealId = taskToDealMap[taskId];
              if (dealId) {
                if (!dealTaskMap[dealId]) dealTaskMap[dealId] = [];
                dealTaskMap[dealId].push({
                  id: taskId,
                  subject: taskItem.properties?.hs_task_subject || 'Task',
                  status: taskItem.properties?.hs_task_status || 'NOT_STARTED',
                  due: taskItem.properties?.hs_timestamp
                    ? new Date(taskItem.properties.hs_timestamp).getTime()
                    : 0,
                  dueStr: taskItem.properties?.hs_timestamp || null,
                });
              }
            });
          }
        }
      }

      // 2. Fetch Meeting Associations
      const meetingAssocRes = await fetch(`${HUBSPOT_BASE_URL}/crm/v4/associations/deals/meetings/batch/read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputs: rawDeals.map((d: any) => ({ id: d.id })) }),
      });
      if (meetingAssocRes.ok) {
        const meetingAssocData = await meetingAssocRes.json();
        const allMeetingInputs: { id: string }[] = [];
        const meetingToDealMap: Record<string, string> = {};

        (meetingAssocData.results || []).forEach((r: any) => {
          const dealId = r.from.id;
          (r.to || []).forEach((m: any) => {
            const mId = m.toObjectId.toString();
            allMeetingInputs.push({ id: mId });
            meetingToDealMap[mId] = dealId;
          });
        });

        if (allMeetingInputs.length > 0) {
          const meetingsRes = await fetch(`${HUBSPOT_BASE_URL}/crm/v3/objects/meetings/batch/read`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              inputs: allMeetingInputs.slice(0, 100),
              properties: ['hs_meeting_title', 'hs_meeting_start_time', 'hs_meeting_outcome'],
            }),
          });
          if (meetingsRes.ok) {
            const meetingsData = await meetingsRes.json();
            (meetingsData.results || []).forEach((mItem: any) => {
              const dealId = meetingToDealMap[mItem.id];
              if (dealId) {
                if (!dealMeetingMap[dealId]) dealMeetingMap[dealId] = [];
                const startMs = mItem.properties?.hs_meeting_start_time
                  ? new Date(mItem.properties.hs_meeting_start_time).getTime()
                  : 0;
                dealMeetingMap[dealId].push({
                  id: mItem.id,
                  title: mItem.properties?.hs_meeting_title || 'Booked Meeting',
                  start: startMs,
                  startDateStr: mItem.properties?.hs_meeting_start_time || null,
                  outcome: mItem.properties?.hs_meeting_outcome || null,
                });
              }
            });
          }
        }
      }
    }
  } catch (err) {
    console.warn('Failed to batch fetch tasks/meetings for deals:', err);
  }

  const customTagsMap = getCustomTagsMap();
  const alignedStoriesMap = getAlignedStoriesMap();

  return rawDeals.map((item: any): Deal => {
    const props = item.properties || {};

    const customTags = customTagsMap[item.id] || [];
    const alignedStoryRecord = alignedStoriesMap[item.id];
    const rawSubSource = props.sub_source || null;
    const rawSource = props.source || null;
    const isLibertyJ = rawSubSource === 'Liberty Jai' || /libby|liberty/i.test(rawSubSource || '') || customTags.some(t => /libby|liberty/i.test(t));

    const createTime = props.createdate ? new Date(props.createdate).getTime() : 0;
    const daysOld = createTime > 0 ? (now - createTime) / (1000 * 60 * 60 * 24) : 999;
    const isNewDeal = daysOld <= 14;

    const tagsSet = new Set<string>();
    if (isLibertyJ) tagsSet.add('Liberty J');
    if (rawSubSource && rawSubSource !== 'Liberty Jai') tagsSet.add(rawSubSource);
    if (rawSource) tagsSet.add(rawSource);
    customTags.forEach((t) => {
      if (!/libby|liberty/i.test(t)) tagsSet.add(t);
    });
    const tags = Array.from(tagsSet);

    // Collect all touchpoint and note timestamps
    const timestamps = [
      props.notes_last_updated ? new Date(props.notes_last_updated).getTime() : 0,
      props.notes_last_contacted ? new Date(props.notes_last_contacted).getTime() : 0,
      props.hs_latest_meeting_activity ? new Date(props.hs_latest_meeting_activity).getTime() : 0,
      props.hs_sales_email_last_replied ? new Date(props.hs_sales_email_last_replied).getTime() : 0,
    ].filter((t) => !isNaN(t) && t > 0);

    // Fall back to hs_lastmodifieddate if no explicit note/activity date is set
    if (timestamps.length === 0 && props.hs_lastmodifieddate) {
      const mod = new Date(props.hs_lastmodifieddate).getTime();
      if (!isNaN(mod) && mod > 0) timestamps.push(mod);
    }

    const latestTouchTime = timestamps.length > 0 ? Math.max(...timestamps) : null;
    let daysSinceContact: number | null = null;
    
    if (latestTouchTime !== null) {
      daysSinceContact = Math.max(0, Math.floor((now - latestTouchTime) / (1000 * 60 * 60 * 24)));
    }

    // Task inspection for planned follow-up
    const dealTasks = dealTaskMap[item.id] || [];
    const openTasks = dealTasks.filter((t) => t.status !== 'COMPLETED');
    openTasks.sort((a, b) => a.due - b.due);

    const futureTask = openTasks.find((t) => t.due >= now);

    // Meeting inspection for planned follow-up (e.g. Talk3PL)
    const dealMeetings = dealMeetingMap[item.id] || [];
    dealMeetings.sort((a, b) => a.start - b.start);
    const futureMeeting = dealMeetings.find((m) => m.start >= now);

    const isMeetingBookedStage = props.dealstage === '1209215206' || (stageLabels[props.dealstage] || '').toLowerCase().includes('meeting booked');

    // An overdue task is ONLY active if it has NOT been fulfilled by a subsequent contact!
    const unfulfilledOverdueTask = openTasks.find((t) => {
      if (t.due >= now) return false;
      if (daysSinceContact === 0) return false; // touched today!
      if (latestTouchTime !== null && latestTouchTime > t.due) return false; // touched after task due date!
      return true;
    });

    let nextTaskDate: string | null = null;
    let nextTaskSubject: string | null = null;

    if (futureTask) {
      nextTaskDate = futureTask.dueStr;
      nextTaskSubject = futureTask.subject;
    } else if (openTasks.length > 0) {
      nextTaskDate = openTasks[0].dueStr;
      nextTaskSubject = openTasks[0].subject;
    }

    const nextMeetingDate = futureMeeting ? futureMeeting.startDateStr : null;
    const nextMeetingTitle = futureMeeting ? futureMeeting.title : null;

    // Health logic
    let health: 'urgent' | 'warning' | 'healthy' | 'neutral' | 'snoozed' = 'healthy';
    let healthReason = 'In active rhythm';

    // 1. If contacted today, celebrate it! (e.g. email sent today)
    if (daysSinceContact === 0) {
      health = 'healthy';
      healthReason = 'Contacted today via email/note';
    } else if (futureMeeting || isMeetingBookedStage) {
      // Meeting is booked! (e.g. Talk3PL) -> Planned follow-up in momentum
      health = 'snoozed';
      if (futureMeeting) {
        const formattedMeetingDate = new Date(futureMeeting.start).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
        });
        healthReason = `Meeting booked: ${futureMeeting.title} (${formattedMeetingDate})`;
      } else {
        healthReason = 'Meeting booked with prospect';
      }
    } else if (futureTask) {
      health = 'snoozed';
      const formattedDue = new Date(futureTask.due).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      healthReason = `Planned follow-up: ${futureTask.subject} (${formattedDue})`;
    } else if (unfulfilledOverdueTask) {
      health = 'warning';
      healthReason = `Task due: ${unfulfilledOverdueTask.subject}`;
    } else if (daysSinceContact !== null && daysSinceContact >= 7) {
      // 7-DAY REMINDER CADENCE (e.g. Marks & Spencer note without action)
      health = 'urgent';
      healthReason = `7-Day Review: Last note/touch ${daysSinceContact}d ago with no next action scheduled.`;
    } else if (daysSinceContact !== null && daysSinceContact >= 4) {
      health = 'warning';
      healthReason = `Follow-up recommended: ${daysSinceContact}d since last touch`;
    } else if (props.dealstage === 'presentationscheduled') {
      // Meeting held (post-demo follow up)
      health = 'warning';
      healthReason = daysSinceContact === 1
        ? 'Meeting held yesterday — commercial proposal / next step due'
        : `Meeting held ${daysSinceContact}d ago — next step due`;
    } else {
      health = 'healthy';
      healthReason = daysSinceContact === 1
        ? 'Touched yesterday'
        : `Touched ${daysSinceContact}d ago`;
    }

    const stageId = props.dealstage || '';
    const stageLabel = stageLabels[stageId] || STAGE_LABELS[stageId] || stageId;

    return {
      id: item.id,
      name: props.dealname || 'Untitled Deal',
      amount: props.amount ? parseFloat(props.amount) : null,
      stage: stageId,
      stageLabel,
      pipeline: props.pipeline || 'default',
      closeDate: props.closedate || null,
      lastModifiedDate: props.hs_lastmodifieddate || item.updatedAt,
      lastContactedDate: props.notes_last_contacted || null,
      daysSinceContact,
      health,
      healthReason,
      ownerId: props.hubspot_owner_id,
      hubspotUrl: `https://app-eu1.hubspot.com/contacts/145683546/record/0-3/${item.id}`,
      nextTaskDate,
      nextTaskSubject,
      nextMeetingDate,
      nextMeetingTitle,
      source: rawSource,
      subSource: rawSubSource,
      tags,
      createdDate: props.createdate || null,
      isNewDeal,
      alignedStory: alignedStoryRecord?.story || null,
      alignedStoryReady: !!alignedStoryRecord,
    };
  });
}

/**
 * Fetch detailed view for a single deal (Notes, Tasks, Contacts, Emails, Meetings, Calls)
 */
export async function getDealDetails(dealId: string): Promise<{
  notes: DealNote[];
  tasks: DealTask[];
  contacts: DealContact[];
  emails: DealEmail[];
  meetings: DealMeeting[];
  calls: DealCall[];
}> {
  if (!TOKEN) throw new Error('HUBSPOT_ACCESS_TOKEN is not configured.');

  // Fetch associations concurrently
  const [notesAssocRes, tasksAssocRes, contactsAssocRes, emailsAssocRes, meetingsAssocRes, callsAssocRes] = await Promise.all([
    fetch(`${HUBSPOT_BASE_URL}/crm/v4/objects/deals/${dealId}/associations/notes`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    }),
    fetch(`${HUBSPOT_BASE_URL}/crm/v4/objects/deals/${dealId}/associations/tasks`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    }),
    fetch(`${HUBSPOT_BASE_URL}/crm/v4/objects/deals/${dealId}/associations/contacts`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    }),
    fetch(`${HUBSPOT_BASE_URL}/crm/v4/objects/deals/${dealId}/associations/emails`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    }),
    fetch(`${HUBSPOT_BASE_URL}/crm/v4/objects/deals/${dealId}/associations/meetings`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    }),
    fetch(`${HUBSPOT_BASE_URL}/crm/v4/objects/deals/${dealId}/associations/calls`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    }),
  ]);

  const [notesAssoc, tasksAssoc, contactsAssoc, emailsAssoc, meetingsAssoc, callsAssoc] = await Promise.all([
    notesAssocRes.ok ? notesAssocRes.json() : { results: [] },
    tasksAssocRes.ok ? tasksAssocRes.json() : { results: [] },
    contactsAssocRes.ok ? contactsAssocRes.json() : { results: [] },
    emailsAssocRes.ok ? emailsAssocRes.json() : { results: [] },
    meetingsAssocRes.ok ? meetingsAssocRes.json() : { results: [] },
    callsAssocRes.ok ? callsAssocRes.json() : { results: [] },
  ]);

  const noteIds = (notesAssoc.results || []).map((r: any) => ({ id: r.toObjectId }));
  const taskIds = (tasksAssoc.results || []).map((r: any) => ({ id: r.toObjectId }));
  const contactIds = (contactsAssoc.results || []).map((r: any) => ({ id: r.toObjectId }));
  const emailIds = (emailsAssoc.results || []).map((r: any) => ({ id: r.toObjectId }));
  const meetingIds = (meetingsAssoc.results || []).map((r: any) => ({ id: r.toObjectId }));
  const callIds = (callsAssoc.results || []).map((r: any) => ({ id: r.toObjectId }));

  // Fetch batch details
  const [notesBatchRes, tasksBatchRes, contactsBatchRes, emailsBatchRes, meetingsBatchRes, callsBatchRes] = await Promise.all([
    noteIds.length > 0
      ? fetch(`${HUBSPOT_BASE_URL}/crm/v3/objects/notes/batch/read`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            inputs: noteIds,
            properties: ['hs_note_body', 'hs_timestamp', 'hs_createdate'],
          }),
        })
      : null,
    taskIds.length > 0
      ? fetch(`${HUBSPOT_BASE_URL}/crm/v3/objects/tasks/batch/read`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            inputs: taskIds,
            properties: [
              'hs_task_subject',
              'hs_task_body',
              'hs_task_status',
              'hs_task_priority',
              'hs_timestamp',
              'hs_createdate',
            ],
          }),
        })
      : null,
    contactIds.length > 0
      ? fetch(`${HUBSPOT_BASE_URL}/crm/v3/objects/contacts/batch/read`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            inputs: contactIds,
            properties: ['firstname', 'lastname', 'email', 'jobtitle', 'phone'],
          }),
        })
      : null,
    emailIds.length > 0
      ? fetch(`${HUBSPOT_BASE_URL}/crm/v3/objects/emails/batch/read`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            inputs: emailIds,
            properties: ['hs_email_subject', 'hs_email_text', 'hs_timestamp', 'hs_email_direction'],
          }),
        })
      : null,
    meetingIds.length > 0
      ? fetch(`${HUBSPOT_BASE_URL}/crm/v3/objects/meetings/batch/read`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            inputs: meetingIds,
            properties: ['hs_meeting_title', 'hs_meeting_body', 'hs_meeting_start_time', 'hs_meeting_end_time', 'hs_meeting_outcome', 'hs_createdate'],
          }),
        })
      : null,
    callIds.length > 0
      ? fetch(`${HUBSPOT_BASE_URL}/crm/v3/objects/calls/batch/read`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            inputs: callIds,
            properties: ['hs_call_title', 'hs_call_body', 'hs_call_disposition', 'hs_call_duration', 'hs_timestamp', 'hs_createdate'],
          }),
        })
      : null,
  ]);

  const [notesBatch, tasksBatch, contactsBatch, emailsBatch, meetingsBatch, callsBatch] = await Promise.all([
    notesBatchRes?.ok ? notesBatchRes.json() : { results: [] },
    tasksBatchRes?.ok ? tasksBatchRes.json() : { results: [] },
    contactsBatchRes?.ok ? contactsBatchRes.json() : { results: [] },
    emailsBatchRes?.ok ? emailsBatchRes.json() : { results: [] },
    meetingsBatchRes?.ok ? meetingsBatchRes.json() : { results: [] },
    callsBatchRes?.ok ? callsBatchRes.json() : { results: [] },
  ]);

  const notes: DealNote[] = (notesBatch.results || [])
    .map((item: any) => ({
      id: item.id,
      body: item.properties?.hs_note_body || '',
      createdAt: item.properties?.hs_createdate || item.createdAt,
      timestamp: item.properties?.hs_timestamp || item.createdAt,
    }))
    .sort(
      (a: DealNote, b: DealNote) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

  const tasks: DealTask[] = (tasksBatch.results || [])
    .map((item: any) => ({
      id: item.id,
      subject: item.properties?.hs_task_subject || 'Untitled Task',
      body: item.properties?.hs_task_body || '',
      status: item.properties?.hs_task_status || 'NOT_STARTED',
      priority: item.properties?.hs_task_priority || 'MEDIUM',
      dueDate: item.properties?.hs_timestamp || null,
      createdAt: item.properties?.hs_createdate || item.createdAt,
    }))
    .sort((a: DealTask, b: DealTask) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });

  const contacts: DealContact[] = (contactsBatch.results || []).map((item: any) => ({
    id: item.id,
    firstName: item.properties?.firstname || '',
    lastName: item.properties?.lastname || '',
    email: item.properties?.email || '',
    jobTitle: item.properties?.jobtitle || '',
    phone: item.properties?.phone || '',
  }));

  const emails: DealEmail[] = (emailsBatch.results || [])
    .map((item: any) => ({
      id: item.id,
      subject: item.properties?.hs_email_subject || 'Email',
      body: item.properties?.hs_email_text || '',
      direction: item.properties?.hs_email_direction || 'EMAIL',
      timestamp: item.properties?.hs_timestamp || item.createdAt,
    }))
    .sort(
      (a: DealEmail, b: DealEmail) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

  const meetings: DealMeeting[] = (meetingsBatch.results || [])
    .map((item: any) => ({
      id: item.id,
      title: item.properties?.hs_meeting_title || 'Meeting',
      body: item.properties?.hs_meeting_body || '',
      startTime: item.properties?.hs_meeting_start_time || null,
      endTime: item.properties?.hs_meeting_end_time || null,
      outcome: item.properties?.hs_meeting_outcome || null,
      createdAt: item.properties?.hs_createdate || item.createdAt,
    }))
    .sort(
      (a: DealMeeting, b: DealMeeting) =>
        new Date(b.startTime || b.createdAt).getTime() - new Date(a.startTime || a.createdAt).getTime()
    );

  const calls: DealCall[] = (callsBatch.results || [])
    .map((item: any) => ({
      id: item.id,
      title: item.properties?.hs_call_title || 'Call',
      body: item.properties?.hs_call_body || '',
      disposition: item.properties?.hs_call_disposition || null,
      duration: item.properties?.hs_call_duration ? parseInt(item.properties.hs_call_duration) : null,
      timestamp: item.properties?.hs_timestamp || item.createdAt,
    }))
    .sort(
      (a: DealCall, b: DealCall) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

  return { notes, tasks, contacts, emails, meetings, calls };
}

export async function addDealNote(dealId: string, noteBody: string): Promise<any> {
  if (!TOKEN) throw new Error('HUBSPOT_ACCESS_TOKEN is not configured.');

  const notePayload = {
    properties: {
      hs_timestamp: new Date().toISOString(),
      hs_note_body: noteBody,
    },
    associations: [
      {
        to: { id: dealId },
        types: [
          {
            associationCategory: 'HUBSPOT_DEFINED',
            associationTypeId: 214, // Note to Deal association
          },
        ],
      },
    ],
  };

  const response = await fetch(`${HUBSPOT_BASE_URL}/crm/v3/objects/notes`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(notePayload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create note: ${errorText}`);
  }

  return response.json();
}

export async function createDealTask(
  dealId: string,
  task: {
    subject: string;
    body?: string;
    dueDate: string; // ISO string or YYYY-MM-DD
    priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  }
): Promise<any> {
  if (!TOKEN) throw new Error('HUBSPOT_ACCESS_TOKEN is not configured.');

  const dueTimestamp = new Date(task.dueDate).getTime().toString();

  const payload = {
    properties: {
      hs_task_subject: task.subject,
      hs_task_body: task.body || '',
      hs_timestamp: dueTimestamp,
      hs_task_status: 'NOT_STARTED',
      hs_task_priority: task.priority || 'HIGH',
      hs_task_type: 'TODO',
      hubspot_owner_id: OWNER_ID,
    },
    associations: [
      {
        to: { id: dealId },
        types: [
          {
            associationCategory: 'HUBSPOT_DEFINED',
            associationTypeId: 216, // Task to Deal association
          },
        ],
      },
    ],
  };

  const response = await fetch(`${HUBSPOT_BASE_URL}/crm/v3/objects/tasks`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create task in HubSpot: ${errorText}`);
  }

  return response.json();
}

export async function updateDealTask(
  taskId: string,
  status: 'COMPLETED' | 'NOT_STARTED'
): Promise<any> {
  if (!TOKEN) throw new Error('HUBSPOT_ACCESS_TOKEN is not configured.');

  const response = await fetch(`${HUBSPOT_BASE_URL}/crm/v3/objects/tasks/${taskId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        hs_task_status: status,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to update task: ${errorText}`);
  }

  return response.json();
}

export async function updateDealSource(dealId: string, subSourceOrTag: string): Promise<boolean> {
  if (!TOKEN) throw new Error('HUBSPOT_ACCESS_TOKEN is not configured.');

  // Map Liberty J to Liberty Jai for HubSpot's enumeration
  const hsSubSource = (subSourceOrTag === 'Liberty J' || subSourceOrTag === 'Libby') ? 'Liberty Jai' : subSourceOrTag;

  // Save to local tags map so it immediately works for any tag
  saveCustomTag(dealId, subSourceOrTag);

  try {
    const response = await fetch(`${HUBSPOT_BASE_URL}/crm/v3/objects/deals/${dealId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          sub_source: hsSubSource,
        },
      }),
    });
    return response.ok;
  } catch (err) {
    console.error('Failed to update deal sub_source in HubSpot:', err);
    return true; // Still persisted locally
  }
}

export async function updateDealStage(dealId: string, stage: string): Promise<any> {
  if (!TOKEN) throw new Error('HUBSPOT_ACCESS_TOKEN is not configured.');

  const response = await fetch(`${HUBSPOT_BASE_URL}/crm/v3/objects/deals/${dealId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        dealstage: stage,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to update deal stage in HubSpot: ${errorText}`);
  }

  return response.json();
}

export async function createDealMeeting(
  dealId: string,
  meeting: {
    title: string;
    body?: string;
    startTime: string; // ISO string or datetime-local
    endTime?: string;
    contactId?: string;
  }
): Promise<any> {
  if (!TOKEN) throw new Error('HUBSPOT_ACCESS_TOKEN is not configured.');

  const startDate = new Date(meeting.startTime);
  const endDate = meeting.endTime
    ? new Date(meeting.endTime)
    : new Date(startDate.getTime() + 30 * 60000);

  const associations: any[] = [
    {
      to: { id: dealId },
      types: [
        {
          associationCategory: 'HUBSPOT_DEFINED',
          associationTypeId: 212, // Meeting to Deal
        },
      ],
    },
  ];

  if (meeting.contactId) {
    associations.push({
      to: { id: meeting.contactId },
      types: [
        {
          associationCategory: 'HUBSPOT_DEFINED',
          associationTypeId: 200, // Meeting to Contact
        },
      ],
    });
  }

  const payload = {
    properties: {
      hs_meeting_title: meeting.title,
      hs_meeting_body: meeting.body || '',
      hs_meeting_start_time: startDate.toISOString(),
      hs_meeting_end_time: endDate.toISOString(),
      hs_meeting_outcome: 'SCHEDULED',
      hubspot_owner_id: OWNER_ID,
    },
    associations,
  };

  const response = await fetch(`${HUBSPOT_BASE_URL}/crm/v3/objects/meetings`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create meeting in HubSpot: ${errorText}`);
  }

  // Also auto-update deal stage to '1209215206' (Meeting Booked) in HubSpot
  try {
    await updateDealStage(dealId, '1209215206');
  } catch (e) {
    console.warn('Could not auto-advance deal stage to Meeting Booked:', e);
  }

  return response.json();
}

export async function createDealCall(
  dealId: string,
  call: {
    title: string;
    body?: string;
    outcome?: string;
    contactId?: string;
    duration?: number;
  }
): Promise<any> {
  if (!TOKEN) throw new Error('HUBSPOT_ACCESS_TOKEN is not configured.');

  const associations: any[] = [
    {
      to: { id: dealId },
      types: [
        {
          associationCategory: 'HUBSPOT_DEFINED',
          associationTypeId: 206, // Call to Deal
        },
      ],
    },
  ];

  if (call.contactId) {
    associations.push({
      to: { id: call.contactId },
      types: [
        {
          associationCategory: 'HUBSPOT_DEFINED',
          associationTypeId: 194, // Call to Contact
        },
      ],
    });
  }

  const payload = {
    properties: {
      hs_call_title: call.title,
      hs_call_body: call.body || '',
      hs_call_status: 'COMPLETED',
      hs_call_disposition: call.outcome || 'f240cda9-c59d-4076-947f-f7288e46cf77', // Connected
      hs_timestamp: new Date().toISOString(),
      hs_call_duration: call.duration ? (call.duration * 60).toString() : '900', // seconds
      hubspot_owner_id: OWNER_ID,
    },
    associations,
  };

  const response = await fetch(`${HUBSPOT_BASE_URL}/crm/v3/objects/calls`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to log call in HubSpot: ${errorText}`);
  }

  return response.json();
}

export async function logDealEmail(
  dealId: string,
  email: {
    subject: string;
    body: string;
    contactId?: string;
  }
): Promise<any> {
  if (!TOKEN) throw new Error('HUBSPOT_ACCESS_TOKEN is not configured.');

  const associations: any[] = [
    {
      to: { id: dealId },
      types: [
        {
          associationCategory: 'HUBSPOT_DEFINED',
          associationTypeId: 210, // Email to Deal
        },
      ],
    },
  ];

  if (email.contactId) {
    associations.push({
      to: { id: email.contactId },
      types: [
        {
          associationCategory: 'HUBSPOT_DEFINED',
          associationTypeId: 198, // Email to Contact
        },
      ],
    });
  }

  const payload = {
    properties: {
      hs_email_subject: email.subject,
      hs_email_text: email.body,
      hs_email_direction: 'EMAIL',
      hs_timestamp: new Date().toISOString(),
      hubspot_owner_id: OWNER_ID,
    },
    associations,
  };

  const response = await fetch(`${HUBSPOT_BASE_URL}/crm/v3/objects/emails`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to log email in HubSpot: ${errorText}`);
  }

  return response.json();
}

