
import { useEffect, useState } from 'react';
import { api } from '../logic/api';
import TimetableViewer from './TimetableViewer';
import { Allocation, Batch, Room, Subject, Teacher, TimeConfig } from '../types';

const DEFAULT_TIME_CONFIG: TimeConfig = {
    startTime: '08:10',
    endTime: '16:00',
    slotDuration: 60,
    breakDuration: 30,
    breakAfterSlots: [4],
};

export default function ViewerDashboard() {
    const [loading, setLoading] = useState(true);
    const [year, setYear] = useState<string>('');
    const [data, setData] = useState<{
        teachers: Teacher[];
        subjects: Subject[];
        rooms: Room[];
        allocations: Allocation[];
        batches: Batch[];
    }>({ teachers: [], subjects: [], rooms: [], allocations: [], batches: [] });

    useEffect(() => {
        const loadData = async () => {
            try {
                const [teachers, subjects, rooms, allocations] = await Promise.all([
                    api.getTeachers(),
                    api.getSubjects(),
                    api.getRooms(),
                    api.getAllocations()
                ]);

                // Infer batches from allocations if not stored separately
                // Or assuming strictly Second/Third Year based on previous context
                // For a robust viewer, we extract unique batches from allocations
                const uniqueBatches = Array.from(new Set(allocations.map((a: any) => a.batchId).filter((b: any) => b && b !== 'All')));
                const inferredBatches: Batch[] = uniqueBatches.map((id: any) => ({
                    id,
                    name: id, // Fallback name
                    year: 'Second Year' // Placeholder, year filtering happens later
                }));

                setData({ teachers, subjects, rooms, allocations, batches: inferredBatches });
            } catch (err) {
                console.error("Failed to load data", err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    // Helper to filter allocations by year
    const filteredAllocations = data.allocations.filter(a => a.year === year);

    // We also need to filter batches/subjects relevant to the View? 
    // TimetableViewer just takes all and looks up IDs. That's fine.

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h2 className="text-xl font-bold text-slate-800 mb-4">View Timetable</h2>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <p className="text-sm text-blue-800">
                        Select an academic year to view the currently approved timetable.
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setYear('Second Year')}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${year === 'Second Year'
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                            }`}
                    >
                        Second Year
                    </button>
                    <button
                        onClick={() => setYear('Third Year')}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${year === 'Third Year'
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                            }`}
                    >
                        Third Year
                    </button>

                </div>
            </div>

            {year ? (
                filteredAllocations.length > 0 ? (
                    <TimetableViewer
                        year={year}
                        allocations={filteredAllocations}
                        timeConfig={DEFAULT_TIME_CONFIG}
                        subjects={data.subjects}
                        teachers={data.teachers}
                        batches={data.batches}
                    />
                ) : (
                    <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300 text-slate-500">
                        No timetable data found for {year}.
                    </div>
                )
            ) : (
                <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-200 text-slate-400">
                    Select a year above to load the timetable.
                </div>
            )}
        </div>
    );
}
