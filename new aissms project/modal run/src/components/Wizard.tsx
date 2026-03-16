import { useState } from 'react';
import { ArrowRight, Lock, CheckCircle } from 'lucide-react';
import { TimetableState } from '../types';
import InputForm from './InputForm';
import TimetableViewer from './TimetableViewer';
import { generateTimetable } from '../logic/scheduler';
import { api } from '../logic/api';

interface WizardStep {
    year: string;
    isLocked: boolean;
    data: any; // Input data for the year
    timetable: TimetableState | null; // Generated timetable
}

const INITIAL_STEPS: WizardStep[] = [
    { year: 'Second Year', isLocked: false, data: null, timetable: null },
    { year: 'Third Year', isLocked: false, data: null, timetable: null },
];

export default function Wizard() {
    const [activeStep, setActiveStep] = useState(0);
    const [steps, setSteps] = useState<WizardStep[]>(INITIAL_STEPS);

    const currentYear = steps[activeStep];

    const [error, setError] = useState<string | null>(null);

    const handleGenerate = (inputData: any) => {
        console.log('Generating for', currentYear.year);
        setError(null);

        try {
            // Collect locked allocations from previous steps
            const lockedAllocations = steps
                .filter(s => s.isLocked && s.timetable)
                .flatMap(s => s.timetable?.allocations || []);

            const timetable = generateTimetable(
                currentYear.year,
                inputData,
                lockedAllocations
            );

            const updatedSteps = [...steps];
            updatedSteps[activeStep].data = inputData;
            updatedSteps[activeStep].timetable = {
                year: currentYear.year,
                isLocked: false,
                allocations: timetable,
                inputData: inputData
            };
            setSteps(updatedSteps);
        } catch (err: any) {
            console.error("Generation failed:", err);
            setError(err.message || 'Failed to generate timetable. Please check constraints.');
        }
    };

    const handleLockAndProceed = async () => {
        const updatedSteps = [...steps];
        updatedSteps[activeStep].isLocked = true;
        setSteps(updatedSteps);

        // Save allocations to DB
        if (currentYear.timetable) {
            try {
                await api.saveAllocationsForYear(currentYear.year, currentYear.timetable.allocations);
            } catch (err) {
                console.error("Failed to save allocations to DB:", err);
                setError("Failed to save schedule to database. You may lose data on reload.");
            }
        }

        if (activeStep < steps.length - 1) {
            setActiveStep(activeStep + 1);
        }
    };

    return (
        <div className="space-y-6">
            {/* Stepper Header */}
            <div className="flex items-center justify-between border-b pb-4">
                {steps.map((step, index) => (
                    <div
                        key={step.year}
                        className={`flex items-center gap-2 ${index === activeStep ? 'text-blue-600 font-bold' :
                            step.isLocked ? 'text-green-600' : 'text-gray-400'
                            }`}
                    >
                        <div className={`
              w-8 h-8 rounded-full flex items-center justify-center border-2
              ${index === activeStep ? 'border-blue-600 bg-blue-50' :
                                step.isLocked ? 'border-green-600 bg-green-50' : 'border-gray-200'}
            `}>
                            {step.isLocked ? <CheckCircle size={16} /> : index + 1}
                        </div>
                        <span>{step.year}</span>
                        {index < steps.length - 1 && <ArrowRight size={16} className="text-gray-300 ml-2" />}
                    </div>
                ))}
            </div>

            {/* Content Area */}
            <div className="bg-white p-6 rounded-lg border min-h-[400px]">
                <div className="mb-4 flex justify-between items-center">
                    <h2 className="text-xl font-semibold">
                        {currentYear.year} configuration
                    </h2>
                    {currentYear.isLocked && (
                        <span className="flex items-center gap-1 text-sm bg-gray-100 px-3 py-1 rounded text-gray-600">
                            <Lock size={14} /> Locked
                        </span>
                    )}
                </div>

                {!currentYear.isLocked ? (
                    <>
                        {error && (
                            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                                <h4 className="font-semibold mb-1">Generation Failed</h4>
                                <p className="text-sm">{error}</p>
                            </div>
                        )}
                        {currentYear.timetable ? (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center bg-green-50 p-2 rounded">
                                    <span className="text-green-700 font-medium">Timetable Generated!</span>
                                    <button
                                        onClick={() => {
                                            const newSteps = [...steps];
                                            newSteps[activeStep].timetable = null;
                                            setSteps(newSteps);
                                        }}
                                        className="text-sm text-red-600 underline"
                                    >
                                        Discard & Edit
                                    </button>
                                </div>
                                <TimetableViewer
                                    year={currentYear.year}
                                    allocations={currentYear.timetable.allocations}
                                    timeConfig={currentYear.timetable.inputData.timeConfig}
                                    subjects={currentYear.timetable.inputData.subjects}
                                    teachers={currentYear.timetable.inputData.teachers}
                                    batches={currentYear.timetable.inputData.batches}
                                    onAllocationMove={(allocation, newDay, newSlotId) => {
                                        const updatedAllocations = currentYear.timetable!.allocations.map(a => {
                                            // Match allocation to update
                                            if (a.day === allocation.day &&
                                                a.slotId === allocation.slotId &&
                                                a.subjectId === allocation.subjectId &&
                                                a.teacherId === allocation.teacherId &&
                                                a.batchId === allocation.batchId) {
                                                return { ...a, day: newDay, slotId: newSlotId };
                                            }
                                            return a;
                                        });

                                        const updatedSteps = [...steps];
                                        updatedSteps[activeStep].timetable = {
                                            ...currentYear.timetable!,
                                            allocations: updatedAllocations
                                        };
                                        setSteps(updatedSteps);
                                    }}
                                />
                            </div>
                        ) : (
                            <InputForm
                                year={currentYear.year}
                                onGenerate={handleGenerate}
                                previousData={steps.slice(0, activeStep).map(s => s.timetable)}
                            />
                        )}
                    </>
                ) : (
                    <div className="space-y-4">
                        <div className="text-center py-4 bg-gray-50 rounded">
                            <CheckCircle size={32} className="mx-auto text-green-500 mb-2" />
                            <h3 className="font-medium text-gray-900">Locked</h3>
                        </div>
                        {currentYear.timetable && (
                            <TimetableViewer
                                year={currentYear.year}
                                allocations={currentYear.timetable.allocations}
                                timeConfig={currentYear.timetable.inputData.timeConfig}
                                subjects={currentYear.timetable.inputData.subjects}
                                teachers={currentYear.timetable.inputData.teachers}
                                batches={currentYear.timetable.inputData.batches}
                            />
                        )}
                    </div>
                )}
            </div>

            {/* Footer Controls */}
            <div className="flex justify-between pt-4">
                <button
                    disabled={activeStep === 0}
                    onClick={() => setActiveStep(prev => prev - 1)}
                    className="px-4 py-2 border rounded hover:bg-gray-50 disabled:opacity-50"
                >
                    Back
                </button>

                {/* Only show Proceed if generated but not locked, or if locked (to move next) */}
                {(!currentYear.isLocked && currentYear.timetable) && (
                    <button
                        onClick={handleLockAndProceed}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
                    >
                        Lock & Proceed <ArrowRight size={16} />
                    </button>
                )}
                {currentYear.isLocked && activeStep < steps.length - 1 && (
                    <button
                        onClick={() => setActiveStep(activeStep + 1)}
                        className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 flex items-center gap-2"
                    >
                        Next Year <ArrowRight size={16} />
                    </button>
                )}
            </div>
        </div>
    );
}
