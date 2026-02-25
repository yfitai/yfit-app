import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { ArrowLeft, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import FormAnalysisLive from '../components/FormAnalysisLive';

export default function FormAnalysis() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const exerciseId = searchParams.get('id');
  
  const [exercise, setExercise] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadExercise() {
      if (!exerciseId) {
        setError('Exercise ID not provided');
        setLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('exercises')
          .select('*')
          .eq('id', exerciseId)
          .single();
        
        if (fetchError) throw fetchError;
        setExercise(data);
      } catch (err) {
        setError('Failed to load exercise details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadExercise();
  }, [exerciseId]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading exercise details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !exercise) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Exercise Not Found</h2>
              <p className="text-muted-foreground mb-4">{error || 'Unable to load exercise details'}</p>
              <Button onClick={() => navigate('/fitness')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Exercise Library
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/fitness')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Exercise Library
        </Button>
        <h1 className="text-3xl font-bold capitalize mb-2">{exercise.name}</h1>
        <div className="flex flex-wrap gap-2">
          {exercise.bodyParts?.map((part, index) => (
            <Badge key={index} variant="secondary">
              {part}
            </Badge>
          ))}
          {exercise.equipments?.map((equip, index) => (
            <Badge key={index} variant="outline">
              {equip}
            </Badge>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Exercise Demonstration */}
        <Card>
          <CardHeader>
            <CardTitle>Exercise Demonstration</CardTitle>
            <CardDescription>Watch the proper form and movement pattern</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted rounded-lg p-4 flex items-center justify-center min-h-[300px]">
              {exercise.gifUrl ? (
                <img
                  src={exercise.gifUrl}
                  alt={exercise.name}
                  className="max-w-full h-auto rounded-lg"
                  loading="lazy"
                />
              ) : (
                <div className="text-center py-8 px-4">
                  <div className="max-w-md mx-auto">
                    <div className="mb-4">
                      <svg className="w-16 h-16 mx-auto text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Upload Your Workout Video</h3>
                    <p className="text-gray-600 mb-4">
                      Record yourself performing this exercise and upload it below for AI-powered form analysis. 
                      Our system will analyze your movement patterns and provide personalized feedback.
                    </p>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm text-blue-800">
                        <strong>🎯 Standout Feature:</strong> Get instant, professional-grade form analysis powered by AI - 
                        a feature typically only available with personal trainers!
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Target Muscles */}
        <Card>
          <CardHeader>
            <CardTitle>Target Muscles</CardTitle>
            <CardDescription>Primary and secondary muscles worked</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2 flex items-center">
                  <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
                  Primary Muscles
                </h3>
                <div className="flex flex-wrap gap-2">
                  {exercise.targetMuscles?.map((muscle, index) => (
                    <Badge key={index} className="capitalize">
                      {muscle}
                    </Badge>
                  )) || <span className="text-muted-foreground">Not specified</span>}
                </div>
              </div>

              {exercise.secondaryMuscles && exercise.secondaryMuscles.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2 flex items-center">
                    <CheckCircle2 className="h-4 w-4 mr-2 text-blue-600" />
                    Secondary Muscles
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {exercise.secondaryMuscles.map((muscle, index) => (
                      <Badge key={index} variant="secondary" className="capitalize">
                        {muscle}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Form Tips */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Proper Form Guidelines</CardTitle>
            <CardDescription>Key points to maintain correct technique</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3 flex items-center text-green-600">
                  <CheckCircle2 className="h-5 w-5 mr-2" />
                  Do This
                </h3>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">•</span>
                    <span>Maintain proper posture throughout the movement</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">•</span>
                    <span>Control the weight in both directions</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">•</span>
                    <span>Breathe consistently (exhale on exertion)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">•</span>
                    <span>Focus on the target muscle group</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">•</span>
                    <span>Use a full range of motion</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-3 flex items-center text-red-600">
                  <XCircle className="h-5 w-5 mr-2" />
                  Avoid This
                </h3>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <span className="text-red-600 mr-2">•</span>
                    <span>Using momentum to move the weight</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-600 mr-2">•</span>
                    <span>Holding your breath during the exercise</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-600 mr-2">•</span>
                    <span>Rounding or arching your back excessively</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-600 mr-2">•</span>
                    <span>Using weight that's too heavy for proper form</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-600 mr-2">•</span>
                    <span>Rushing through repetitions</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Safety Tips */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Safety Considerations</CardTitle>
            <CardDescription>Important safety information for this exercise</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mr-3 mt-0.5 flex-shrink-0" />
                <div className="space-y-2">
                  <p className="font-semibold text-amber-900 dark:text-amber-100">
                    Before You Begin
                  </p>
                  <ul className="space-y-1 text-sm text-amber-800 dark:text-amber-200">
                    <li>• Always warm up before starting your workout</li>
                    <li>• Start with lighter weights to master the form</li>
                    <li>• Stop immediately if you feel sharp pain</li>
                    <li>• Consider using a spotter for heavy lifts</li>
                    <li>• Consult a fitness professional if you're unsure about technique</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Form Analysis Section */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">AI Form Analysis</h2>
        <p className="text-gray-600 mb-6">
          Start the camera to get real-time AI-powered form feedback with automatic rep counting.
        </p>
        <FormAnalysisLive />
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex flex-wrap gap-4">
        <Button onClick={() => navigate('/fitness')} size="lg">
          Add to Workout
        </Button>
        <Button variant="outline" size="lg" onClick={() => window.print()}>
          Print Instructions
        </Button>
      </div>
    </div>
  );
}

