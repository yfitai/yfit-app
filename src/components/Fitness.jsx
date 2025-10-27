import { useState } from 'react';
import { 
  Dumbbell, BookOpen, Play, Camera, TrendingUp, Plus 
} from 'lucide-react';
import ExerciseLibrary from './ExerciseLibrary';
import WorkoutBuilder from './WorkoutBuilder';
import WorkoutLogger from './WorkoutLogger';
import FormAnalysis from './FormAnalysis';
import FormAnalysisLive from './FormAnalysisLive';
import FitnessProgress from './FitnessProgress';

const Fitness = () => {
  const [activeTab, setActiveTab] = useState('library');

  const tabs = [
    { id: 'library', name: 'Exercise Library', icon: BookOpen },
    { id: 'builder', name: 'Create Workout', icon: Plus },
    { id: 'logger', name: 'Log Workout', icon: Play },
    { id: 'form-live', name: 'Form Analysis', icon: Camera },
    { id: 'progress', name: 'Progress', icon: TrendingUp }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'library':
        return <ExerciseLibrary />;
      case 'builder':
        return <WorkoutBuilder />;
      case 'logger':
        return <WorkoutLogger onNavigateToBuilder={() => setActiveTab('builder')} />;
      case 'form-live':
        return <FormAnalysisLive />;
      case 'progress':
        return <FitnessProgress />;
      default:
        return <ExerciseLibrary />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Dumbbell className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Fitness Tracking</h1>
                <p className="text-sm text-gray-600">Track workouts, analyze form, and monitor progress</p>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{tab.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto">
        {renderContent()}
      </div>
    </div>
  );
};

export default Fitness;
