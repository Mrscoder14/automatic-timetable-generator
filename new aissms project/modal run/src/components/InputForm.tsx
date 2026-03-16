import { useState, useMemo } from 'react';
import { Plus, Trash2, Settings, Users, BookOpen, LayoutGrid, Clock, Layers, Activity, Zap, Wand2 } from 'lucide-react';
import { Teacher, Subject, Room, TimeConfig, Batch } from '../types';
import { api } from '../logic/api';
import { useEffect } from 'react';

interface InputFormProps {
    year: string;
    onGenerate: (data: any) => void;
    previousData: any[];
}

export default function InputForm({ year, onGenerate }: InputFormProps) {

    const [timeConfig, setTimeConfig] = useState<TimeConfig>({
        startTime: '08:10',
        endTime: '16:00',
        slotDuration: 60,
        breakAfterSlots: [],
        breakDuration: 60,
        customBreaks: [
            { startTime: '10:10', endTime: '10:30', duration: 20 },
            { startTime: '12:30', endTime: '13:00', duration: 30 }
        ]
    });

    const [batches, setBatches] = useState<Batch[]>([
        { id: '1', name: 'Batch A', rollStart: '1', rollEnd: '20' },
        { id: '2', name: 'Batch B', rollStart: '21', rollEnd: '40' },
        { id: '3', name: 'Batch C', rollStart: '41', rollEnd: '60' }
    ]);

    const [teachers, setTeachers] = useState<Teacher[]>([
        { id: '1', name: 'Mrs. Deshpande', subjects: [] },
        { id: '2', name: 'Mr. Patil', subjects: [] }
    ]);

    const [subjects, setSubjects] = useState<Subject[]>([
        { id: '1', name: 'Mathematics-I', type: 'theory', lecturesPerWeek: 3, practicalsPerWeek: 0, teacherIds: [] }
    ]);

    const [rooms, setRooms] = useState<Room[]>([
        { id: '1', name: 'Classroom 101', type: 'classroom' },
        { id: '2', name: 'Physics Lab', type: 'lab' }
    ]);

    const [showAutoBatch, setShowAutoBatch] = useState(false);
    const [autoBatchConfig, setAutoBatchConfig] = useState({ start: 1, end: 60, size: 20 });

    // Load data from DB on mount
    useEffect(() => {
        const loadData = async () => {
            try {
                const [dbTeachers, dbSubjects, dbRooms] = await Promise.all([
                    api.getTeachers(),
                    api.getSubjects(),
                    api.getRooms()
                ]);

                if (dbTeachers && dbTeachers.length > 0) setTeachers(dbTeachers);
                if (dbSubjects && dbSubjects.length > 0) setSubjects(dbSubjects);
                if (dbRooms && dbRooms.length > 0) setRooms(dbRooms);
            } catch (err) {
                console.error("Failed to load data from DB:", err);
            }
        };
        loadData();
    }, []);

    const handleSaveToDB = async () => {
        try {
            await api.syncAll({ teachers, subjects, rooms });
            alert("Data saved to database successfully!");
        } catch (err) {
            console.error("Failed to save to DB:", err);
            alert("Failed to save to database.");
        }
    };

    // Derived Stats
    const stats = useMemo(() => {
        const totalWeeklyLoad = subjects.reduce((acc, s) => acc + s.lecturesPerWeek + s.practicalsPerWeek, 0);
        const theoryCount = subjects.filter(s => s.type === 'theory').length;
        const practCount = subjects.filter(s => s.type === 'practical').length;
        return { totalWeeklyLoad, theoryCount, practCount };
    }, [subjects]);

    const addTeacher = () => {
        const id = `t-${Date.now()}`;
        setTeachers([...teachers, { id, name: `Teacher ${teachers.length + 1}`, subjects: [] }]);
    };

    const addSubject = () => {
        const id = (subjects.length + 1 + Math.random().toString(36).substr(2, 5));
        setSubjects([...subjects, {
            id,
            name: `New Subject`,
            type: 'theory',
            lecturesPerWeek: 3,
            practicalsPerWeek: 0,
            teacherIds: []
        }]);
    };

    const addRoom = () => {
        const id = (rooms.length + 1 + Math.random()).toString();
        setRooms([...rooms, { id, name: `New Room`, type: 'classroom' }]);
    };

    const addBatch = () => {
        const id = `b-${Date.now()}`;
        setBatches([...batches, { id, name: `Batch ${String.fromCharCode(65 + batches.length)}`, rollStart: '', rollEnd: '' }]);
    };

    const generateBatches = () => {
        const { start, end, size } = autoBatchConfig;
        const newBatches: Batch[] = [];
        let currentStart = start;
        let batchCount = 0;

        while (currentStart <= end) {
            const currentEnd = Math.min(currentStart + size - 1, end);
            batchCount++;
            newBatches.push({
                id: `b-auto-${Date.now()}-${batchCount}`,
                name: `Batch ${String.fromCharCode(64 + batchCount)}`,
                rollStart: currentStart.toString(),
                rollEnd: currentEnd.toString()
            });
            currentStart += size;
        }
        setBatches(newBatches);
        setShowAutoBatch(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onGenerate({ teachers, subjects, rooms, timeConfig, batches });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8 animate-enter">

            {/* 0. Dashboard Stats Header */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="glass-panel rounded-xl p-4 flex flex-col items-center justify-center text-center">
                    <span className="text-3xl font-bold text-indigo-600 font-mono">{subjects.length}</span>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Total Subjects</span>
                </div>
                <div className="glass-panel rounded-xl p-4 flex flex-col items-center justify-center text-center">
                    <span className="text-3xl font-bold text-green-600 font-mono">{stats.totalWeeklyLoad}</span>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Weekly Load (Hrs)</span>
                </div>
                <div className="glass-panel rounded-xl p-4 flex flex-col items-center justify-center text-center">
                    <span className="text-3xl font-bold text-orange-600 font-mono">{teachers.length}</span>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Faculty Count</span>
                </div>
                <div className="glass-panel rounded-xl p-4 flex flex-col items-center justify-center text-center">
                    <span className="text-3xl font-bold text-blue-600 font-mono">{batches.length}</span>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Batches</span>
                </div>
            </div>

            {/* 1. Global Configuration */}
            <div className="card border-l-4 border-l-indigo-500">
                <div className="px-6 py-4 border-b border-white/50 bg-gradient-to-r from-indigo-50/50 to-transparent flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-600"><Settings size={20} /></div>
                    <div>
                        <h3 className="font-bold text-slate-800">Global Configuration</h3>
                        <p className="text-xs text-slate-500">Set the master schedule parameters for {year}</p>
                    </div>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="group">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">College Start Time</label>
                        <div className="relative group-focus-within:scale-[1.02] transition-transform">
                            <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                            <input
                                type="time"
                                value={timeConfig.startTime}
                                onChange={(e) => setTimeConfig({ ...timeConfig, startTime: e.target.value })}
                                className="input-field pl-10 font-mono text-sm"
                            />
                        </div>
                    </div>
                    <div className="group">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">End Time (Cutoff)</label>
                        <div className="relative group-focus-within:scale-[1.02] transition-transform">
                            <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-red-500 transition-colors" />
                            <input
                                type="time"
                                value={timeConfig.endTime}
                                onChange={(e) => setTimeConfig({ ...timeConfig, endTime: e.target.value })}
                                className="input-field pl-10 font-mono text-sm"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Slot Duration</label>
                        <div className="relative group-focus-within:scale-[1.02] transition-transform">
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-medium">min</span>
                            <input
                                type="number"
                                value={timeConfig.slotDuration}
                                onChange={(e) => setTimeConfig({ ...timeConfig, slotDuration: parseInt(e.target.value) })}
                                className="input-field font-mono text-sm"
                            />
                        </div>
                    </div>
                    {/* Fixed Breaks UI (Read Only) */}
                    <div className="col-span-1 md:col-span-1 border-l pl-4 border-slate-200">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Fixed Breaks</label>
                        <div className="space-y-2">
                            {timeConfig.customBreaks?.map((b, idx) => (
                                <div key={idx} className="flex gap-1 items-center">
                                    <span className="text-xs bg-yellow-50 text-yellow-700 px-2 py-1 rounded font-mono border border-yellow-100 flex items-center gap-2">
                                        <Activity size={10} />
                                        {b.startTime} - {b.endTime}
                                    </span>
                                </div>
                            ))}
                            <div className="text-[10px] text-slate-400 italic mt-2">
                                * Standard mandated breaks
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Batches & Rooms & Faculty Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                {/* Batches */}
                <div className="card h-full flex flex-col border-l-4 border-l-teal-500">
                    <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-teal-50/50 to-transparent flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-teal-100/50 rounded text-teal-600"><Layers size={18} /></div>
                            <h3 className="font-bold text-slate-800">Batches</h3>
                        </div>
                        <div className="flex gap-1">
                            <button type="button" onClick={() => setShowAutoBatch(!showAutoBatch)} title="Auto-generate Batches" className={`text-teal-600 hover:bg-teal-50 p-1.5 rounded transition-colors ${showAutoBatch ? 'bg-teal-50' : ''}`}><Wand2 size={18} /></button>
                            <button type="button" onClick={addBatch} className="text-teal-600 hover:bg-teal-50 p-1.5 rounded transition-colors"><Plus size={18} /></button>
                        </div>
                    </div>
                    {showAutoBatch && (
                        <div className="p-4 bg-teal-50/30 border-b border-teal-100 animate-enter">
                            <div className="grid grid-cols-3 gap-3 mb-3">
                                <div>
                                    <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Start Roll</label>
                                    <input
                                        type="number"
                                        value={autoBatchConfig.start}
                                        onChange={(e) => setAutoBatchConfig({ ...autoBatchConfig, start: parseInt(e.target.value) || 0 })}
                                        className="w-full border border-slate-200 rounded px-2 py-1 text-sm font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">End Roll</label>
                                    <input
                                        type="number"
                                        value={autoBatchConfig.end}
                                        onChange={(e) => setAutoBatchConfig({ ...autoBatchConfig, end: parseInt(e.target.value) || 0 })}
                                        className="w-full border border-slate-200 rounded px-2 py-1 text-sm font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Max Size</label>
                                    <input
                                        type="number"
                                        value={autoBatchConfig.size}
                                        onChange={(e) => setAutoBatchConfig({ ...autoBatchConfig, size: parseInt(e.target.value) || 0 })}
                                        className="w-full border border-slate-200 rounded px-2 py-1 text-sm font-mono"
                                    />
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={generateBatches}
                                className="w-full py-1.5 bg-teal-600 text-white text-xs font-bold rounded shadow-sm hover:bg-teal-700 transition-colors flex items-center justify-center gap-2"
                            >
                                <Wand2 size={12} /> Auto-Divide Into Batches
                            </button>
                        </div>
                    )}
                    <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-[300px] custom-scrollbar">
                        {batches.map((b, idx) => (
                            <div key={b.id} className="border border-slate-200 rounded-lg p-3 text-sm bg-white/50 hover:bg-white transition-colors animate-enter" style={{ animationDelay: `${idx * 0.05}s` }}>
                                <div className="flex justify-between items-center mb-2">
                                    <input value={b.name} onChange={(e) => {
                                        const newBatches = [...batches];
                                        newBatches[idx].name = e.target.value;
                                        setBatches(newBatches);
                                    }} className="font-bold text-slate-700 bg-transparent border-none p-0 focus:ring-0 w-full" placeholder="Batch Name" />
                                    <button onClick={() => setBatches(batches.filter((_, i) => i !== idx))} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-[9px] text-slate-400 font-bold uppercase block mb-0.5">Start Roll</label>
                                        <input value={b.rollStart} onChange={(e) => { const n = [...batches]; n[idx].rollStart = e.target.value; setBatches(n); }} className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-mono" placeholder="001" />
                                    </div>
                                    <div>
                                        <label className="text-[9px] text-slate-400 font-bold uppercase block mb-0.5">End Roll</label>
                                        <input value={b.rollEnd} onChange={(e) => { const n = [...batches]; n[idx].rollEnd = e.target.value; setBatches(n); }} className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-mono" placeholder="060" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Rooms */}
                <div className="card h-full flex flex-col border-l-4 border-l-orange-500">
                    <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-orange-50/50 to-transparent flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-orange-100/50 rounded text-orange-600"><LayoutGrid size={18} /></div>
                            <h3 className="font-bold text-slate-800">Rooms</h3>
                        </div>
                        <button type="button" onClick={addRoom} className="text-orange-600 hover:bg-orange-50 p-1.5 rounded transition-colors"><Plus size={18} /></button>
                    </div>
                    <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-[300px] custom-scrollbar">
                        {rooms.map((r, idx) => (
                            <div key={r.id} className="flex gap-2 items-center bg-white/50 p-2 rounded-lg border border-slate-200 hover:border-orange-200 transition-all animate-enter" style={{ animationDelay: `${idx * 0.05}s` }}>
                                <div className={`w-1.5 h-8 rounded-full shrink-0 ${r.type === 'lab' ? 'bg-purple-500' : 'bg-orange-500'}`} title={r.type}></div>
                                <input value={r.name} onChange={(e) => { const n = [...rooms]; n[idx].name = e.target.value; setRooms(n); }} className="flex-1 bg-transparent border-none p-0 focus:ring-0 text-sm font-medium text-slate-700" placeholder="Room Name" />
                                <select value={r.type} onChange={(e) => { const n = [...rooms]; n[idx].type = e.target.value as any; setRooms(n); }} className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-[10px] uppercase font-bold tracking-wide text-slate-500 w-24">
                                    <option value="classroom">Class</option>
                                    <option value="lab">Lab</option>
                                </select>
                                <button onClick={() => setRooms(rooms.filter((_, i) => i !== idx))} className="text-slate-300 hover:text-red-500 transition-colors px-1"><Trash2 size={14} /></button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Teachers */}
                <div className="card h-full flex flex-col border-l-4 border-l-green-500">
                    <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-green-50/50 to-transparent flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-green-100/50 rounded text-green-600"><Users size={18} /></div>
                            <h3 className="font-bold text-slate-800">Faculty</h3>
                        </div>
                        <button type="button" onClick={addTeacher} className="text-green-600 hover:bg-green-50 p-1.5 rounded transition-colors"><Plus size={18} /></button>
                    </div>
                    <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-[300px] custom-scrollbar">
                        {teachers.map((t, idx) => (
                            <div key={t.id} className="flex gap-3 items-center group bg-white/50 p-2 rounded-lg border border-slate-200 hover:border-green-200 transition-all animate-enter" style={{ animationDelay: `${idx * 0.05}s` }}>
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center text-green-700 text-xs font-bold border border-green-200 shadow-sm">
                                    {t.name.substring(0, 2).toUpperCase()}
                                </div>
                                <input value={t.name} onChange={(e) => { const n = [...teachers]; n[idx].name = e.target.value; setTeachers(n); }} className="flex-1 bg-transparent border-none p-0 focus:ring-0 text-sm font-medium text-slate-700" placeholder="Teacher Name" />
                                <button onClick={() => setTeachers(teachers.filter((_, i) => i !== idx))} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all px-1"><Trash2 size={14} /></button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* 3. Subjects (Full Width) */}
            <div className="card border-l-4 border-l-blue-500">
                <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-blue-50/50 to-transparent flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-blue-100/50 rounded text-blue-600"><BookOpen size={18} /></div>
                        <div>
                            <h3 className="font-bold text-slate-800">Curriculum</h3>
                            <p className="text-xs text-slate-500">Manage theory and practical courses</p>
                        </div>
                    </div>
                    <button type="button" onClick={addSubject} className="text-blue-600 text-sm font-bold hover:text-blue-700 flex items-center gap-1 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors border border-blue-100 shadow-sm">
                        <Plus size={16} /> ADD SUBJECT
                    </button>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {subjects.map((s, idx) => (
                        <div key={s.id} className="border border-slate-200 rounded-xl p-5 bg-white shadow-sm hover:shadow-lg transition-all duration-300 relative group animate-enter" style={{ animationDelay: `${idx * 0.05}s` }}>
                            <button
                                type="button"
                                onClick={() => setSubjects(subjects.filter((_, i) => i !== idx))}
                                className="absolute top-3 right-3 text-slate-300 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-50"
                            >
                                <Trash2 size={16} />
                            </button>

                            {/* Subject Header */}
                            <div className="mb-4 pr-6">
                                <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1 tracking-wider">Subject Name</label>
                                <input
                                    value={s.name}
                                    onChange={(e) => {
                                        const newSubjects = [...subjects];
                                        newSubjects[idx].name = e.target.value;
                                        setSubjects(newSubjects);
                                    }}
                                    className="w-full font-bold text-slate-800 text-lg border-b border-dashed border-slate-300 pb-1 focus:border-indigo-500 focus:outline-none placeholder:text-slate-300 bg-transparent transition-colors"
                                    placeholder="Enter Name"
                                />
                            </div>

                            {/* Subject Config */}
                            <div className="space-y-5">
                                {/* Type Selection */}
                                <div>
                                    <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1.5 tracking-wider">Course Type</label>
                                    <div className="flex gap-2 p-1 bg-slate-100/80 rounded-lg">
                                        {['theory', 'practical'].map((type) => (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => { const n = [...subjects]; n[idx].type = type as any; setSubjects(n); }}
                                                className={`flex-1 py-1.5 text-xs font-bold rounded-md capitalize transition-all duration-200 ${s.type === type
                                                    ? (type === 'theory' ? 'bg-white text-blue-600 shadow-sm' : 'bg-white text-pink-600 shadow-sm')
                                                    : 'text-slate-400 hover:text-slate-600'}`}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Counts Row */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1.5 tracking-wider">Lectures/Wk</label>
                                        <div className="relative">
                                            <Activity size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-blue-400" />
                                            <input
                                                type="number" min="0"
                                                value={s.lecturesPerWeek}
                                                onChange={(e) => { const n = [...subjects]; n[idx].lecturesPerWeek = parseInt(e.target.value) || 0; setSubjects(n); }}
                                                className="w-full border border-slate-200 rounded-lg pl-8 pr-2 py-2 text-center font-bold text-slate-700 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1.5 tracking-wider">Practicals/Wk</label>
                                        <div className="relative">
                                            <Zap size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-pink-400" />
                                            <input
                                                type="number" min="0"
                                                value={s.practicalsPerWeek}
                                                onChange={(e) => { const n = [...subjects]; n[idx].practicalsPerWeek = parseInt(e.target.value) || 0; setSubjects(n); }}
                                                className="w-full border border-slate-200 rounded-lg pl-8 pr-2 py-2 text-center font-bold text-slate-700 focus:ring-2 focus:ring-pink-100 focus:border-pink-400 transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Faculty */}
                                <div>
                                    <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1.5 tracking-wider">Assigned Faculty</label>

                                    {s.type === 'theory' ? (
                                        <div className="relative">
                                            <select
                                                multiple
                                                className="w-full border border-slate-200 rounded-lg text-xs p-2.5 h-24 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all custom-scrollbar"
                                                value={s.teacherIds || []}
                                                onChange={(e) => {
                                                    const selected = Array.from(e.target.selectedOptions, option => option.value);
                                                    const newSubjects = [...subjects];
                                                    newSubjects[idx].teacherIds = selected;
                                                    setSubjects(newSubjects);
                                                }}
                                            >
                                                {teachers.map(t => (
                                                    <option key={t.id} value={t.id} className="py-1 px-1">{t.name}</option>
                                                ))}
                                            </select>
                                            <p className="text-[9px] text-slate-400 mt-1.5 text-right font-medium">Use Ctrl (Cmd) to select multiple</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                                            {batches.length === 0 ? (
                                                <p className="text-xs text-slate-400 italic text-center py-2">No batches defined.</p>
                                            ) : (
                                                batches.map(batch => (
                                                    <div key={batch.id} className="flex items-center justify-between gap-2 text-xs bg-slate-50 p-2 rounded border border-slate-100">
                                                        <span className="font-bold text-slate-600 truncate w-1/3" title={batch.name}>{batch.name}</span>
                                                        <select
                                                            className="flex-1 bg-white border border-slate-200 rounded px-2 py-1 text-slate-700 text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                                                            value={s.practicalBatchMap?.[batch.id] || ''}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                const newSubjects = [...subjects];
                                                                const map = { ...(newSubjects[idx].practicalBatchMap || {}) };

                                                                if (val) map[batch.id] = val;
                                                                else delete map[batch.id];

                                                                newSubjects[idx].practicalBatchMap = map;

                                                                // Sync teacherIds to include ALL mapped teachers, so scheduler sees them as "eligible" even if we haven't updated scheduler logic yet
                                                                // (Though ideally we WILL update scheduler logic to be strict)
                                                                newSubjects[idx].teacherIds = Array.from(new Set(Object.values(map)));

                                                                setSubjects(newSubjects);
                                                            }}
                                                        >
                                                            <option value="">Select Faculty...</option>
                                                            {teachers.map(t => (
                                                                <option key={t.id} value={t.id}>{t.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={addSubject}
                        className="border-2 border-dashed border-slate-300 rounded-xl p-4 flex flex-col items-center justify-center text-slate-400 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all duration-300 min-h-[400px] group"
                    >
                        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4 group-hover:bg-indigo-100 transition-colors">
                            <Plus size={32} />
                        </div>
                        <span className="font-bold text-sm tracking-wide">ADD NEW SUBJECT</span>
                    </button>
                </div>
            </div>

            <div className="flex justify-end pt-4 pb-12 gap-4">
                <button
                    type="button"
                    onClick={handleSaveToDB}
                    className="px-6 py-3 border border-indigo-200 text-indigo-700 font-bold rounded-lg hover:bg-indigo-50 transition-colors"
                >
                    Save Configuration
                </button>
                <button
                    type="submit"
                    className="btn-primary shadow-xl shadow-indigo-500/20 text-lg px-12 py-3.5 hover:-translate-y-1 transition-transform"
                >
                    Generate Schedule for {year}
                </button>
            </div>
        </form>
    );
}
