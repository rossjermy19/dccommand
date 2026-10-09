import { NextResponse } from 'next/server';
import { createDealTask, updateDealTask } from '@/lib/hubspot';

export async function POST(req: Request) {
  try {
    const { dealId, subject, body, dueDate, priority } = await req.json();

    if (!dealId || !subject || !dueDate) {
      return NextResponse.json(
        { success: false, error: 'dealId, subject, and dueDate are required' },
        { status: 400 }
      );
    }

    const task = await createDealTask(dealId, {
      subject,
      body,
      dueDate,
      priority: priority || 'HIGH',
    });

    return NextResponse.json({ success: true, task });
  } catch (error: any) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create task' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const { taskId, status } = await req.json();

    if (!taskId || !status) {
      return NextResponse.json(
        { success: false, error: 'taskId and status are required' },
        { status: 400 }
      );
    }

    const result = await updateDealTask(taskId, status);
    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update task' },
      { status: 500 }
    );
  }
}
