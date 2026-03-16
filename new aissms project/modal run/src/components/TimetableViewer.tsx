import {
    DndContext,
    DragEndEvent,
    MouseSensor,
    TouchSensor,
    useDraggable,
    useDroppable,
    useSensor,
    useSensors,
} from '@dnd-kit/core';

import { generateSlots } from '../logic/scheduler';
import { Allocation, TimeConfig, Subject, Teacher, Batch } from '../types';

interface TimetableViewerProps {
    year: string;
    allocations: Allocation[];
    timeConfig: TimeConfig;
    subjects: Subject[];
    teachers: Teacher[];
    batches: Batch[];
    onClose?: () => void;
    onAllocationMove?: (allocation: Allocation, newDay: string, newSlotId: string) => void;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

function DraggableAllocation({ allocation, children }: { allocation: Allocation, children: React.ReactNode }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: JSON.stringify(allocation),
        data: allocation,
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 999,
        position: 'relative' as const,
        opacity: isDragging ? 0.5 : 1,
    } : undefined;

    return (
        <div ref={setNodeRef} style={style} {...listeners} {...attributes} className="w-full cursor-grab active:cursor-grabbing">
            {children}
        </div>
    );
}

function DroppableCell({ day, slotId, children, isBreak }: { day: string, slotId: string, children: React.ReactNode, isBreak?: boolean }) {
    const { isOver, setNodeRef } = useDroppable({
        id: JSON.stringify({ day, slotId }), // Unique ID for the slot
        data: { day, slotId },
        disabled: isBreak
    });

    const style = {
        backgroundColor: isOver ? '#e0f2fe' : undefined,
    };

    return (
        <td
            ref={setNodeRef}
            style={style}
            className={`border p-2 align-top h-20 min-w-[120px] transition-colors ${isBreak ? 'bg-gray-50' : ''}`}
        >
            {children}
        </td>
    );
}

export default function TimetableViewer({ year, allocations, timeConfig, subjects, teachers, batches, onClose, onAllocationMove }: TimetableViewerProps) {
    const sensors = useSensors(
        useSensor(MouseSensor, {
            activationConstraint: {
                distance: 10,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 250,
                tolerance: 5,
            },
        })
    );

    const rawSlots = generateSlots(timeConfig, 2);

    const displaySlotsWithIds = rawSlots.map(s => ({
        id: s.id,
        start: s.startTime,
        end: s.endTime,
        isBreak: s.type === 'break'
    }));

    const getSubjectName = (id: string) => subjects.find(s => s.id === id)?.name || id;
    const getTeacherName = (id: string) => teachers.find(t => t.id === id)?.name || id;
    const getBatchName = (id: string) => id === 'All' ? 'All' : batches.find(b => b.id === id)?.name || id;

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.data.current && onAllocationMove) {
            const allocation = active.data.current as Allocation;
            const { day, slotId } = over.data.current as { day: string, slotId: string };

            if (allocation.day !== day || allocation.slotId !== slotId) {
                onAllocationMove(allocation, day, slotId);
            }
        }
    };

    const renderAllocationContent = (cell: Allocation) => (
        <div className="bg-blue-100 p-1 rounded text-xs w-full text-left shadow-sm border border-blue-200">
            <div className="font-bold text-blue-800 truncate">{getSubjectName(cell.subjectId)}</div>
            <div className="font-medium text-gray-700">{cell.type}</div>
            <div className="flex justify-between text-[10px] text-gray-600 mt-1">
                <span>Batch: {getBatchName(cell.batchId || 'All')}</span>
                {cell.roomId && <span>{cell.roomId}</span>}
            </div>
            {cell.teacherId && <div className="text-[10px] truncate">T: {getTeacherName(cell.teacherId)}</div>}
        </div>
    );

    return (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <div className="bg-white rounded shadow border p-4">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">{year} Timetable</h3>
                    {onClose && (
                        <button onClick={onClose} className="text-sm text-blue-600 underline">
                            Close
                        </button>
                    )}
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse border text-sm text-center">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="border p-2">Time</th>
                                {DAYS.map(d => <th key={d} className="border p-2">{d}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {displaySlotsWithIds.map((slot) => (
                                <tr key={slot.id} className={slot.isBreak ? 'bg-yellow-50' : ''}>
                                    <td className="border p-2 font-medium whitespace-nowrap">
                                        {slot.start} - {slot.end}
                                        {slot.isBreak && <div className="text-xs text-gray-500">(Break)</div>}
                                    </td>
                                    {DAYS.map(day => {
                                        const cells = allocations.filter(a => a.day === day && a.slotId === slot.id);
                                        
                                        const sortedCells = [...cells].sort((a, b) => {
                                            const batchNameA = getBatchName(a.batchId || 'All');
                                            const batchNameB = getBatchName(b.batchId || 'All');
                                            return batchNameA.localeCompare(batchNameB);
                                        });

                                        return (
                                            <DroppableCell key={day} day={day} slotId={slot.id} isBreak={slot.isBreak}>
                                                {slot.isBreak ? (
                                                    <span className="text-gray-400">---</span>
                                                ) : (
                                                    <div className="flex flex-col gap-1 items-center min-h-[50px] w-full">
                                                        {sortedCells.length === 0 ? (
                                                            <span className="text-gray-300 italic self-center my-auto">Free</span>
                                                        ) : (
                                                            sortedCells.map((cell, cIdx) => (
                                                                onAllocationMove ? (
                                                                    <DraggableAllocation key={cIdx} allocation={cell}>
                                                                        {renderAllocationContent(cell)}
                                                                    </DraggableAllocation>
                                                                ) : (
                                                                    <div key={cIdx} className="w-full">
                                                                        {renderAllocationContent(cell)}
                                                                    </div>
                                                                )
                                                            ))
                                                        )}
                                                    </div>
                                                )}
                                            </DroppableCell>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </DndContext>
    );
}
