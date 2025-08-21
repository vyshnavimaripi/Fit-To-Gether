import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, ChevronRight, Users, Trophy, Target, Heart, Calendar, MapPin, Star, ArrowRight, 
  CheckCircle, TrendingUp, Shield, Activity, User, Lock, Eye, EyeOff, Plus, LogOut, 
  BarChart3, AlertTriangle, Clock, Award, Dumbbell, Timer, Play
} from 'lucide-react';
import { Button } from './components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './components/ui/dialog';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Textarea } from './components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Progress } from './components/ui/progress';
import { Alert, AlertDescription } from './components/ui/alert';
import './App.css';+0

import { auth, db } from './firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, addDoc, getDocs, query, where, doc, updateDoc, arrayUnion } from 'firebase/firestore';

function App() {
  const [healthWarnings, setHealthWarnings] = useState([]);
  // Handle logging progress for a challenge
  const handleLogProgress = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Add progress to Firestore (you may want to adjust the collection/fields as needed)
      await addDoc(collection(db, 'progress'), {
        user_id: user ? user.uid : '',
        challenge_id: progressForm.challenge_id,
        value: progressForm.value,
        notes: progressForm.notes,
        logged_at: new Date()
      });
      // Optionally, you can update userChallenges or show a success message
      alert('Progress logged!');
      setProgressForm({ challenge_id: '', value: '', notes: '' });
    } catch (error) {
      alert('Failed to log progress: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  // State management
  const [currentSlide, setCurrentSlide] = useState(0);
  const [user, setUser] = useState(null);
  const [authDialog, setAuthDialog] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [currentView, setCurrentView] = useState('landing');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [challenges, setChallenges] = useState([]);
  const [userChallenges, setUserChallenges] = useState([]);

    // Form states
    const [loginForm, setLoginForm] = useState({ email: '', password: '' });
    const [registerForm, setRegisterForm] = useState({
      email: '', password: '', full_name: '', age_group: '', fitness_level: ''
    });
    const [challengeForm, setChallengeForm] = useState({
      name: '', description: '', goal_type: 'steps', target_value: '', 
      duration_days: '', age_groups: [], difficulty_level: 'medium'
    });
    const [progressForm, setProgressForm] = useState({
      challenge_id: '', value: '', notes: ''
    });

    // Auth functions using Firebase
    const handleRegister = async (e) => {
      e.preventDefault();
      setLoading(true);
      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          registerForm.email,
          registerForm.password
        );
        // Save extra user info to Firestore
        await addDoc(collection(db, 'users'), {
          uid: userCredential.user.uid,
          full_name: registerForm.full_name,
          age_group: registerForm.age_group,
          fitness_level: registerForm.fitness_level,
          email: registerForm.email,
          created_at: new Date()
        });
        setUser(userCredential.user);
        setAuthDialog(false);
        setCurrentView('dashboard');
      } catch (error) {
        alert('Registration failed: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    const handleLogin = async (e) => {
      e.preventDefault();
      setLoading(true);
      try {
        const userCredential = await signInWithEmailAndPassword(
          auth,
          loginForm.email,
          loginForm.password
        );
        setUser(userCredential.user);
        setAuthDialog(false);
        setCurrentView('dashboard');
      } catch (error) {
        alert('Login failed: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    const handleLogout = async () => {
      await signOut(auth);
      setUser(null);
      setCurrentView('landing');
    };

    // Challenge CRUD using Firestore
    const loadChallenges = async () => {
      const querySnapshot = await getDocs(collection(db, 'challenges'));
      const challengeList = [];
      querySnapshot.forEach((doc) => {
        challengeList.push({ id: doc.id, ...doc.data() });
      });
      setChallenges(challengeList);
    };

    const handleCreateChallenge = async (e) => {
      e.preventDefault();
      setLoading(true);
      try {
        await addDoc(collection(db, 'challenges'), {
          ...challengeForm,
          created_by: user ? user.uid : '',
          created_at: new Date(),
          participants: []
        });
        await loadChallenges();
        alert('Challenge created!');
      } catch (error) {
        alert('Failed to create challenge: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    const handleJoinChallenge = async (challengeId) => {
      try {
        const challengeRef = doc(db, 'challenges', challengeId);
        if (!user || !user.uid) throw new Error('User not logged in');
        // Fetch the challenge document directly by ID
        const challengeSnap = await challengeRef.get ? await challengeRef.get() : await import('firebase/firestore').then(m => m.getDoc(challengeRef));
        const challengeDoc = challengeSnap.exists ? challengeSnap.data() : null;
        const participants = Array.isArray(challengeDoc?.participants) ? challengeDoc.participants : [];
        if (participants.indexOf(user.uid) !== -1) {
          alert('You have already joined this challenge!');
          return;
        }
        await updateDoc(challengeRef, {
          participants: arrayUnion(user.uid)
        });
        await loadChallenges();
        alert('Successfully joined challenge!');
      } catch (error) {
        alert('Failed to join challenge: ' + error.message);
      }
    };

    useEffect(() => {
      if (user) {
        loadChallenges();
      }
    }, [user]);

  // Carousel effects
    useEffect(() => {
      const timer = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % carouselSlides.length);
      }, 5000);
      return () => clearInterval(timer);
    }, []);

  // Load user data on mount if Firebase user exists
  useEffect(() => {
    if (auth.currentUser) {
      setUser(auth.currentUser);
      setCurrentView('dashboard');
    }
  }, []);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % carouselSlides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + carouselSlides.length) % carouselSlides.length);


  // Carousel slides data
  const carouselSlides = [
    {
      title: "Kids' Fun Challenges",
      subtitle: "Playful fitness for growing minds and bodies",
      description: "Dance workouts, playground adventures, sports games, and active learning activities designed to make movement fun and engaging for children.",
      image: "https://images.pexels.com/photos/7201565/pexels-photo-7201565.jpeg",
      ageGroup: "Ages 5-12",
      activities: ["Dance Parties", "Active Games", "Sports Basics", "Playground Fun"]
    },
    {
      title: "Young Adult Power",
      subtitle: "High-energy challenges for busy lifestyles",
      description: "HIIT workouts, running challenges, strength training, and wellness routines that fit into demanding schedules while building lifelong habits.",
      image: "https://images.unsplash.com/photo-1517130038641-a774d04afb3c",
      ageGroup: "Ages 18-35",
      activities: ["HIIT Workouts", "Running Clubs", "Strength Training", "Yoga Sessions"]
    },
    {
      title: "Family Wellness Together",
      subtitle: "Bonding through shared fitness goals",
      description: "Family step challenges, weekend hiking adventures, home workout sessions, and outdoor activities that bring everyone together for health and fun.",
      image: "https://images.pexels.com/photos/7220529/pexels-photo-7220529.jpeg",
      ageGroup: "All Family",
      activities: ["Family Walks", "Bike Rides", "Home Workouts", "Weekend Adventures"]
    },
    {
      title: "Active Aging Excellence",
      subtitle: "Gentle, effective fitness for golden years",
      description: "Chair yoga, water aerobics, balance training, and social walking groups designed to maintain strength, flexibility, and independence.",
      image: "https://images.unsplash.com/photo-1743358899830-9559031fe95c",
      ageGroup: "Ages 55+",
      activities: ["Chair Yoga", "Water Aerobics", "Balance Training", "Walking Groups"]
    }
  ];

  // Render different views
  if (currentView === 'dashboard' && user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        {/* Dashboard Navigation */}
        <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-xl flex items-center justify-center">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">FitTogether</h1>
                  <p className="text-xs text-gray-600">Welcome, {user.full_name}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentView('landing')}
                  className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                >
                  Back to Home
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleLogout}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Tabs defaultValue="overview" className="space-y-8">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="challenges">My Challenges</TabsTrigger>
              <TabsTrigger value="progress">Log Progress</TabsTrigger>
              <TabsTrigger value="explore">Explore</TabsTrigger>
              <TabsTrigger value="warnings">Health Alerts</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Total Challenges</p>
                        <p className="text-2xl font-bold text-emerald-600">
                          {dashboardData?.stats?.total_challenges || 0}
                        </p>
                      </div>
                      <Trophy className="w-8 h-8 text-emerald-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Active</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {dashboardData?.stats?.active_challenges || 0}
                        </p>
                      </div>
                      <Timer className="w-8 h-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Completed</p>
                        <p className="text-2xl font-bold text-green-600">
                          {dashboardData?.stats?.completed_challenges || 0}
                        </p>
                      </div>
                      <Award className="w-8 h-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Success Rate</p>
                        <p className="text-2xl font-bold text-purple-600">
                          {Math.round(dashboardData?.stats?.completion_rate || 0)}%
                        </p>
                      </div>
                      <BarChart3 className="w-8 h-8 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Exercise Guidelines */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Heart className="w-5 h-5 mr-2 text-emerald-600" />
                    Your Age Group Exercise Guidelines
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {dashboardData?.exercise_guidelines && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Recommended Activities</h4>
                        <div className="space-y-2">
                          {dashboardData.exercise_guidelines.activities?.map((activity, index) => (
                            <div key={index} className="flex items-center text-sm text-gray-600">
                              <CheckCircle className="w-4 h-4 text-emerald-500 mr-2" />
                              {activity}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Guidelines</h4>
                        <div className="space-y-2 text-sm text-gray-600">
                          <p><strong>Age Range:</strong> {dashboardData.exercise_guidelines.age_range}</p>
                          <p><strong>Daily Activity:</strong> {dashboardData.exercise_guidelines.daily_minutes || dashboardData.exercise_guidelines.weekly_aerobic}</p>
                          <p><strong>Strength Training:</strong> {dashboardData.exercise_guidelines.strength_frequency}</p>
                          {dashboardData.exercise_guidelines.balance_frequency && (
                            <p><strong>Balance Training:</strong> {dashboardData.exercise_guidelines.balance_frequency}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* My Challenges Tab */}
            <TabsContent value="challenges" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userChallenges.map((challenge) => (
                  <Card key={challenge.challenge_id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-lg">{challenge.name}</CardTitle>
                      <Badge className="w-fit">
                        {challenge.goal_type} • {challenge.difficulty_level}
                      </Badge>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-4">{challenge.description}</p>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Target: {challenge.target_value} {challenge.goal_type}</span>
                          <span>{challenge.duration_days} days</span>
                        </div>
                        <Progress value={75} className="h-2" />
                        <p className="text-xs text-gray-500">75% complete</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Log Progress Tab */}
            <TabsContent value="progress" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Log Your Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogProgress} className="space-y-4">
                    <div>
                      <Label>Select Challenge</Label>
                      <Select 
                        value={progressForm.challenge_id} 
                        onValueChange={(value) => setProgressForm({...progressForm, challenge_id: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a challenge" />
                        </SelectTrigger>
                        <SelectContent>
                          {userChallenges.map((challenge) => (
                            <SelectItem key={challenge.challenge_id} value={challenge.challenge_id}>
                              {challenge.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Progress Value</Label>
                      <Input
                        type="number"
                        placeholder="Enter your progress (e.g., steps, minutes)"
                        value={progressForm.value}
                        onChange={(e) => setProgressForm({...progressForm, value: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label>Notes (Optional)</Label>
                      <Textarea
                        placeholder="How did it go? Any notes?"
                        value={progressForm.notes}
                        onChange={(e) => setProgressForm({...progressForm, notes: e.target.value})}
                      />
                    </div>
                    
                    <Button type="submit" disabled={loading} className="w-full">
                      {loading ? 'Logging...' : 'Log Progress'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Explore Tab */}
            <TabsContent value="explore" className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold">Explore Challenges</h3>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-emerald-500 to-blue-500">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Challenge
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Create New Challenge</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateChallenge} className="space-y-4">
                      <div>
                        <Label>Challenge Name</Label>
                        <Input
                          placeholder="e.g., Daily Walking Challenge"
                          value={challengeForm.name}
                          onChange={(e) => setChallengeForm({...challengeForm, name: e.target.value})}
                          required
                        />
                      </div>
                      
                      <div>
                        <Label>Description</Label>
                        <Textarea
                          placeholder="Describe your challenge..."
                          value={challengeForm.description}
                          onChange={(e) => setChallengeForm({...challengeForm, description: e.target.value})}
                          required
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Goal Type</Label>
                          <Select 
                            value={challengeForm.goal_type} 
                            onValueChange={(value) => setChallengeForm({...challengeForm, goal_type: value})}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="steps">Steps</SelectItem>
                              <SelectItem value="workouts">Workouts</SelectItem>
                              <SelectItem value="cycling">Cycling</SelectItem>
                              <SelectItem value="yoga">Yoga</SelectItem>
                              <SelectItem value="strength">Strength Training</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label>Target Value</Label>
                          <Input
                            type="number"
                            placeholder="e.g., 10000"
                            value={challengeForm.target_value}
                            onChange={(e) => setChallengeForm({...challengeForm, target_value: e.target.value})}
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Duration (days)</Label>
                          <Input
                            type="number"
                            placeholder="e.g., 30"
                            value={challengeForm.duration_days}
                            onChange={(e) => setChallengeForm({...challengeForm, duration_days: e.target.value})}
                            required
                          />
                        </div>
                        
                        <div>
                          <Label>Difficulty</Label>
                          <Select 
                            value={challengeForm.difficulty_level} 
                            onValueChange={(value) => setChallengeForm({...challengeForm, difficulty_level: value})}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="easy">Easy</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="hard">Hard</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <Button type="submit" disabled={loading} className="w-full">
                        {loading ? 'Creating...' : 'Create Challenge'}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {challenges.filter(challenge => !challenge.is_joined).map((challenge) => (
                  <Card key={challenge.challenge_id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-lg">{challenge.name}</CardTitle>
                      <div className="flex space-x-2">
                        <Badge>{challenge.goal_type}</Badge>
                        <Badge variant="outline">{challenge.difficulty_level}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-4">{challenge.description}</p>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span>Target: {challenge.target_value} {challenge.goal_type}</span>
                          <span>{challenge.duration_days} days</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>{challenge.participants_count} participants</span>
                          <span className="text-emerald-600">Age groups: {challenge.age_groups.join(', ')}</span>
                        </div>
                        <Button 
                          onClick={() => handleJoinChallenge(challenge.challenge_id)}
                          className="w-full bg-gradient-to-r from-emerald-500 to-blue-500"
                        >
                          Join Challenge
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Health Warnings Tab */}
            <TabsContent value="warnings" className="space-y-6">
              <div className="space-y-4">
                {healthWarnings.length > 0 ? (
                  healthWarnings.map((warning) => (
                    <Alert key={warning.warning_id} className={`border-l-4 ${
                      warning.severity === 'high' ? 'border-red-500 bg-red-50' :
                      warning.severity === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                      'border-blue-500 bg-blue-50'
                    }`}>
                      <AlertTriangle className={`h-4 w-4 ${
                        warning.severity === 'high' ? 'text-red-500' :
                        warning.severity === 'medium' ? 'text-yellow-500' :
                        'text-blue-500'
                      }`} />
                      <AlertDescription>
                        <div className="space-y-3">
                          <div>
                            <h4 className="font-semibold text-gray-900">{warning.message}</h4>
                            <p className="text-sm text-gray-600 mt-1">
                              Severity: <span className="capitalize font-medium">{warning.severity}</span>
                            </p>
                          </div>
                          
                          {warning.warning_image_url && (
                            <div className="mt-3">
                              <img 
                                src={warning.warning_image_url} 
                                alt="Health warning illustration"
                                className="rounded-lg max-w-xs"
                              />
                            </div>
                          )}
                          
                          <div>
                            <h5 className="font-medium text-gray-900 mb-2">Potential Health Risks:</h5>
                            <ul className="space-y-1">
                              {warning.age_specific_risks.map((risk, index) => (
                                <li key={index} className="text-sm text-gray-600 flex items-center">
                                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></div>
                                  {risk}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </AlertDescription>
                    </Alert>
                  ))
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Great Job!</h3>
                      <p className="text-gray-600">No health warnings at this time. Keep up the excellent work with your fitness routine!</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  }

  // Landing page view
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">FitTogether</h1>
                <p className="text-xs text-gray-600">Fitness for Everyone</p>
              </div>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#home" className="text-gray-700 hover:text-emerald-600 font-medium transition-colors">Home</a>
              <a href="#challenges" className="text-gray-700 hover:text-emerald-600 font-medium transition-colors">Challenges</a>
              <a href="#features" className="text-gray-700 hover:text-emerald-600 font-medium transition-colors">Features</a>
              <a href="#about" className="text-gray-700 hover:text-emerald-600 font-medium transition-colors">About Us</a>
              <a href="#contact" className="text-gray-700 hover:text-emerald-600 font-medium transition-colors">Contact</a>
            </div>

            <div className="flex items-center space-x-3">
              <Dialog open={authDialog} onOpenChange={setAuthDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50">
                    <User className="w-4 h-4 mr-2" />
                    Login
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>{authMode === 'login' ? 'Welcome Back' : 'Join FitTogether'}</DialogTitle>
                  </DialogHeader>
                  
                  <Tabs value={authMode} onValueChange={setAuthMode}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="login">Login</TabsTrigger>
                      <TabsTrigger value="register">Register</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="login">
                      <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                          <Label>Email</Label>
                          <Input
                            type="email"
                            placeholder="your@email.com"
                            value={loginForm.email}
                            onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                            required
                          />
                        </div>
                        <div>
                          <Label>Password</Label>
                          <div className="relative">
                            <Input
                              type={showPassword ? "text" : "password"}
                              placeholder="Your password"
                              value={loginForm.password}
                              onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                              required
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-1 top-1/2 -translate-y-1/2"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                          </div>
                        </div>
                        <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-emerald-500 to-blue-500">
                          {loading ? 'Signing in...' : 'Sign In'}
                        </Button>
                      </form>
                    </TabsContent>
                    
                    <TabsContent value="register">
                      <form onSubmit={handleRegister} className="space-y-4">
                        <div>
                          <Label>Full Name</Label>
                          <Input
                            placeholder="Your full name"
                            value={registerForm.full_name}
                            onChange={(e) => setRegisterForm({...registerForm, full_name: e.target.value})}
                            required
                          />
                        </div>
                        <div>
                          <Label>Email</Label>
                          <Input
                            type="email"
                            placeholder="your@email.com"
                            value={registerForm.email}
                            onChange={(e) => setRegisterForm({...registerForm, email: e.target.value})}
                            required
                          />
                        </div>
                        <div>
                          <Label>Password</Label>
                          <div className="relative">
                            <Input
                              type={showPassword ? "text" : "password"}
                              placeholder="Create a password"
                              value={registerForm.password}
                              onChange={(e) => setRegisterForm({...registerForm, password: e.target.value})}
                              required
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-1 top-1/2 -translate-y-1/2"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Age Group</Label>
                            <Select 
                              value={registerForm.age_group} 
                              onValueChange={(value) => setRegisterForm({...registerForm, age_group: value})}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select age" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="kids">Kids (5-12)</SelectItem>
                                <SelectItem value="youth">Youth (13-17)</SelectItem>
                                <SelectItem value="adults">Adults (18-64)</SelectItem>
                                <SelectItem value="seniors">Seniors (65+)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Fitness Level</Label>
                            <Select 
                              value={registerForm.fitness_level} 
                              onValueChange={(value) => setRegisterForm({...registerForm, fitness_level: value})}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select level" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="beginner">Beginner</SelectItem>
                                <SelectItem value="intermediate">Intermediate</SelectItem>
                                <SelectItem value="advanced">Advanced</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-emerald-500 to-blue-500">
                          {loading ? 'Creating account...' : 'Create Account'}
                        </Button>
                      </form>
                    </TabsContent>
                  </Tabs>
                </DialogContent>
              </Dialog>
              
              <Button 
                className="bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white"
                onClick={() => setAuthDialog(true)}
              >
                Join Now
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1607962837359-5e7e89f86776" 
            alt="Multi-generational fitness community"
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-blue-500/20"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-8">
            <Badge className="bg-white/90 text-emerald-700 border-emerald-200 px-4 py-2 text-sm font-medium">
              🌟 Launching the Future of Inclusive Fitness
            </Badge>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight">
              Get Fit <span className="bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">Together</span>
              <br />
              Challenges for Every Age, Every Lifestyle!
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-700 max-w-4xl mx-auto leading-relaxed">
              From school kids to senior citizens – join fun, personalized challenges and make fitness a shared journey. 
              <span className="font-semibold text-emerald-700"> One platform. Every age. Every step counts.</span>
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white px-8 py-4 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                onClick={() => setAuthDialog(true)}
              >
                Start Your Challenge <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-2 border-emerald-500 text-emerald-700 hover:bg-emerald-50 px-8 py-4 text-lg font-semibold rounded-full"
                onClick={() => document.getElementById('challenges').scrollIntoView({ behavior: 'smooth' })}
              >
                Explore Challenges
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-12 max-w-2xl mx-auto">
              {["Kids & Teens", "Young Adults", "Active Parents", "Golden Years"].map((group, index) => (
                <div key={index} className="bg-white/80 backdrop-blur-sm rounded-lg p-3 text-center shadow-sm">
                  <div className="text-2xl font-bold text-emerald-600">{index === 0 ? "5-17" : index === 1 ? "18-35" : index === 2 ? "36-54" : "55+"}</div>
                  <div className="text-sm text-gray-600 font-medium">{group}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Rest of the landing page content remains the same... */}
      {/* Carousel Section */}
      <section id="challenges" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Challenges Designed for <span className="bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">Every Generation</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover age-appropriate fitness challenges that grow with you and your family, from playful activities for kids to gentle exercises for seniors.
            </p>
          </div>

          <div className="relative max-w-6xl mx-auto">
            <div className="overflow-hidden rounded-2xl shadow-2xl">
              <div className="relative h-96 md:h-[500px]">
                {carouselSlides.map((slide, index) => (
                  <div
                    key={index}
                    className={`absolute inset-0 transition-all duration-500 ease-in-out ${
                      index === currentSlide ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'
                    }`}
                  >
                    <div className="relative h-full">
                      <img 
                        src={slide.image} 
                        alt={slide.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/20"></div>
                      
                      <div className="absolute inset-0 flex items-center">
                        <div className="max-w-2xl mx-auto px-8 text-white">
                          <Badge className="bg-white/20 text-white border-white/30 mb-4">
                            {slide.ageGroup}
                          </Badge>
                          <h3 className="text-3xl md:text-5xl font-bold mb-4">{slide.title}</h3>
                          <p className="text-xl md:text-2xl font-medium mb-6">{slide.subtitle}</p>
                          <p className="text-lg opacity-90 mb-8 leading-relaxed">{slide.description}</p>
                          
                          <div className="flex flex-wrap gap-2 mb-8">
                            {slide.activities.map((activity, actIndex) => (
                              <Badge key={actIndex} className="bg-white/20 text-white border-white/30">
                                {activity}
                              </Badge>
                            ))}
                          </div>
                          
                          <Button 
                            className="bg-white text-gray-900 hover:bg-gray-100 font-semibold px-6 py-3 rounded-full"
                            onClick={() => setAuthDialog(true)}
                          >
                            Join This Challenge <ArrowRight className="ml-2 w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation Buttons */}
            <Button
              onClick={prevSlide}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/90 text-gray-900 hover:bg-white rounded-full p-3 shadow-lg z-10"
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
            <Button
              onClick={nextSlide}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/90 text-gray-900 hover:bg-white rounded-full p-3 shadow-lg z-10"
            >
              <ChevronRight className="w-6 h-6" />
            </Button>

            {/* Slide Indicators */}
            <div className="flex justify-center mt-8 space-x-2">
              {carouselSlides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentSlide ? 'bg-emerald-500 w-8' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Add more sections here... Features, About, etc. */}
      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-emerald-600 to-blue-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
            One Platform. Every Age. <br />Every Step Counts.
          </h2>
          <p className="text-xl md:text-2xl text-white/90 mb-12 max-w-2xl mx-auto">
            Join thousands of families, individuals, and communities who are making fitness a shared journey. Start your challenge today!
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              size="lg" 
              className="bg-white text-emerald-600 hover:bg-gray-100 px-10 py-4 text-lg font-bold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              onClick={() => setAuthDialog(true)}
            >
              Join the FitTogether Community
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">FitTogether</h1>
                <p className="text-sm text-gray-400">Fitness for Everyone</p>
              </div>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-8">
              Where wellness is for everyone. Join our community and make fitness a shared journey across all ages and abilities.
            </p>
            <div className="border-t border-gray-800 pt-8">
              <p className="text-gray-400 text-sm">
                © 2025 FitTogether. All rights reserved. • Where Wellness is for Everyone
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;