import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { useMLAnalytics } from '../hooks/useMLAnalytics';
import {
  Plane, MapPin, Clock, Users, PackageCheck, AlertCircle, CheckCircle2,
  CloudRain, Wind, Eye, Droplets, Zap, ArrowLeft, ShieldAlert, Brain,
  Wrench, Fuel, UtensilsCrossed, Luggage, CheckCheck, ChevronRight, Loader2,
  Filter, ChevronLeft
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

// ── Timeline helpers ────────────────────────────────────────────────────────
type StepStatus = 'completed' | 'current' | 'pending' | 'delayed';

interface TimelineStep {
  label: string;
  time: string;
  description: string;
  status: StepStatus;
}

function parseMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function addMinutes(hhmm: string, delta: number): string {
  if (!hhmm || hhmm === '--' || hhmm === 'Cancelled') return '--:--';
  const total = (parseMinutes(hhmm) + delta + 1440) % 1440;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function generateTimeline(flight: any): TimelineStep[] {
  const sched = flight.scheduledTime === '--' ? '12:00' : flight.scheduledTime;
  const isDelayed = flight.status === 'Delayed';
  const isBoarding = flight.status === 'Boarding';
  const isDeparted = flight.status === 'Departed';
  const isArrived = flight.status === 'Arrived';

  if (flight.type === 'Departure') {
    return [
      {
        label: 'Check-in Opens',
        time: addMinutes(sched, -150),
        description: 'Check-in counters open. Pax advised to arrive.',
        status: 'completed',
      },
      {
        label: 'Ground Crew Assigned',
        time: addMinutes(sched, -120),
        description: 'Ramp crew, fueling team, and catering units assigned.',
        status: 'completed',
      },
      {
        label: 'Aircraft Arrives at Gate',
        time: addMinutes(sched, -90),
        description: 'Inbound aircraft docked. Cleaning crew boards.',
        status: 'completed',
      },
      {
        label: 'Fueling Complete',
        time: addMinutes(sched, -60),
        description: `Fuel load: ${Math.round(Math.random() * 5 + 18) * 1000} kg. Checked & signed off.`,
        status: isDelayed ? 'delayed' : 'completed',
      },
      {
        label: 'Catering & Cleaning Done',
        time: addMinutes(sched, -50),
        description: 'Cabin cleaned, catering loaded, lavatories serviced.',
        status: isDelayed ? 'delayed' : 'completed',
      },
      {
        label: 'Boarding Begins',
        time: addMinutes(sched, -45),
        description: 'Priority boarding then general boarding zones.',
        status: isDeparted
          ? 'completed'
          : isBoarding
            ? 'current'
            : isDelayed
              ? 'delayed'
              : 'pending',
      },
      {
        label: 'Gate Closes',
        time: addMinutes(sched, -15),
        description: 'Final boarding call. Gate door sealed.',
        status: isDeparted ? 'completed' : 'pending',
      },
      {
        label: 'Pushback',
        time: sched,
        description: 'Tug connected. Pushback clearance from ATC.',
        status: isDeparted ? 'completed' : 'pending',
      },
      {
        label: 'Airborne',
        time: addMinutes(sched, 10),
        description: 'Aircraft lifts off. Gate now cleared for next operation.',
        status: isDeparted ? 'completed' : 'pending',
      },
    ];
  } else {
    // Arrival
    return [
      {
        label: 'Departed Origin',
        time: addMinutes(sched, -200),
        description: 'Aircraft departed origin airport on schedule.',
        status: 'completed',
      },
      {
        label: 'Cruising Altitude',
        time: addMinutes(sched, -150),
        description: 'Aircraft at cruising altitude. ETA confirmed.',
        status: 'completed',
      },
      {
        label: 'Descent Initiated',
        time: addMinutes(sched, -40),
        description: 'Descent underway. Ground crew on standby.',
        status: isDelayed ? 'delayed' : 'completed',
      },
      {
        label: 'Touchdown',
        time: sched,
        description: `Runway ${Math.floor(Math.random() * 9 + 1) * 10}L — airspeed nominal.`,
        status: isArrived
          ? 'completed'
          : isDelayed
            ? 'delayed'
            : 'current',
      },
      {
        label: 'Taxi to Gate',
        time: addMinutes(sched, 12),
        description: 'ATC taxi clearance issued. Ground vehicle escort.',
        status: isArrived ? 'completed' : 'pending',
      },
      {
        label: 'Doors Open',
        time: addMinutes(sched, 22),
        description: 'Jet bridge connected. Crew disembarkation begins.',
        status: isArrived ? 'completed' : 'pending',
      },
      {
        label: 'Baggage on Belt',
        time: addMinutes(sched, 37),
        description: 'Baggage carousel assigned. First bags expected.',
        status: isArrived ? 'completed' : 'pending',
      },
    ];
  }
}

// ── Ground ops checklists ──────────────────────────────────────────────────
const DEPARTURE_CHECKLIST = [
  { label: 'Fueling sign-off', icon: Fuel, done: true },
  { label: 'Catering loaded', icon: UtensilsCrossed, done: true },
  { label: 'Cabin cleaning cleared', icon: CheckCheck, done: true },
  { label: 'Baggage loaded', icon: Luggage, done: true },
  { label: 'Maintenance sign-off', icon: Wrench, done: false },
  { label: 'Boarding complete', icon: Users, done: false },
];

const ARRIVAL_CHECKLIST = [
  { label: 'Jet bridge position', icon: Plane, done: true },
  { label: 'Ground crew ready', icon: CheckCheck, done: true },
  { label: 'Baggage cart queued', icon: Luggage, done: false },
  { label: 'Customs notified', icon: ShieldAlert, done: true },
  { label: 'Medical crew on standby', icon: Users, done: false },
];

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_OPTIONS = [
  { value: 'On Time', label: 'On Time', color: 'text-green-700', bg: 'bg-green-50 border-green-200 hover:bg-green-100' },
  { value: 'Boarding', label: 'Boarding', color: 'text-blue-700', bg: 'bg-blue-50  border-blue-200  hover:bg-blue-100' },
  { value: 'Delayed', label: 'Delayed', color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100' },
  { value: 'Departed', label: 'Departed', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200 hover:bg-purple-100' },
  { value: 'Arrived', label: 'Arrived', color: 'text-teal-700', bg: 'bg-teal-50  border-teal-200  hover:bg-teal-100' },
  { value: 'Cancelled', label: 'Cancelled', color: 'text-red-700', bg: 'bg-red-50   border-red-200   hover:bg-red-100' },
];

// ── Component ─────────────────────────────────────────────────────────────────
export default function GroundServicesDashboard() {
  const { data, loading } = useMLAnalytics();

  const [flightStatuses, setFlightStatuses] = useState<Record<string, string>>({});
  const [selectedFlight, setSelectedFlight] = useState<any | null>(null);
  const [panelView, setPanelView] = useState<'detail' | 'timeline' | 'status'>('detail');

  // --- Filter State ---
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterReview, setFilterReview] = useState(false);

  // --- Expandable Alert State ---
  const [isReviewExpanded, setIsReviewExpanded] = useState(false);
  const ALERT_DISPLAY_LIMIT = 15;

  // --- NEW: Tab & Pagination State ---
  const [activeTab, setActiveTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  if (loading || !data) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center text-gray-500 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        <p>Loading live ground operations...</p>
      </div>
    );
  }

  // 1. Map raw live flights
  const processedFlights = (data.liveFlights || []).map((f: any) => ({
    ...f,
    type: f.destination === 'JFK' ? 'Arrival' : 'Departure'
  }));

  // 2. Helper to get either the manual override status OR the live backend status
  const getFlightStatus = (flight: any) => flightStatuses[flight.id] ?? flight.status;

  // 3. Filter for active flights & apply the user filters
  const activeFlights = processedFlights.filter((f: any) => {
    const s = getFlightStatus(f);
    if (s !== 'Boarding' && s !== 'On Time' && s !== 'Delayed') return false;
    if (filterStatus !== 'All' && s !== filterStatus) return false;
    if (filterReview && !f.dispatchReview) return false;
    return true;
  });

  const arrivals = activeFlights.filter((f: any) => f.type === 'Arrival');
  const departures = activeFlights.filter((f: any) => f.type === 'Departure');

  // --- NEW: Apply Pagination based on the selected Tab ---
  let currentList = activeFlights;
  if (activeTab === 'arrivals') currentList = arrivals;
  if (activeTab === 'departures') currentList = departures;

  const totalPages = Math.max(1, Math.ceil(currentList.length / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedList = currentList.slice(
    (safeCurrentPage - 1) * ITEMS_PER_PAGE,
    safeCurrentPage * ITEMS_PER_PAGE
  );

  const dispatcherReviewFlights = processedFlights.filter((p: any) => p.dispatchReview);
  const visibleReviewFlights = isReviewExpanded
    ? dispatcherReviewFlights
    : dispatcherReviewFlights.slice(0, ALERT_DISPLAY_LIMIT);

  const handleSelectFlight = (flight: any) => {
    setSelectedFlight(flight);
    setPanelView('detail');
  };

  const handleStatusUpdate = (flightId: string, newStatus: string) => {
    setFlightStatuses((prev) => ({ ...prev, [flightId]: newStatus }));
    if (selectedFlight?.id === flightId) {
      setSelectedFlight((prev: any) => prev ? { ...prev, status: newStatus } : null);
    }
    setPanelView('detail');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'On Time': return 'bg-green-100 text-green-800';
      case 'Delayed': return 'bg-yellow-100 text-yellow-800';
      case 'Boarding': return 'bg-blue-100 text-blue-800';
      case 'Departed': return 'bg-purple-100 text-purple-800';
      case 'Arrived': return 'bg-teal-100 text-teal-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'On Time': return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'Delayed': return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'Boarding': return <Plane className="h-4 w-4 text-blue-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  // ── Flight Card ─────────────────────────────────────────────────────────────
  const FlightCard = ({ flight }: { flight: any }) => {
    const status = getFlightStatus(flight);
    return (
      <Card
        className={`cursor-pointer transition-all hover:shadow-md ${selectedFlight?.id === flight.id ? 'ring-2 ring-blue-500' : ''
          } ${flight.dispatchReview ? 'border-red-200' : ''}`}
        onClick={() => handleSelectFlight(flight)}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                {getStatusIcon(status)}
                <span className="font-semibold text-lg">{flight.flightNumber}</span>
                <Badge className={getStatusColor(status)}>{status}</Badge>
                <Badge variant="outline">{flight.type}</Badge>
                {flight.dispatchReview && (
                  <span className="inline-flex items-center gap-1 text-xs bg-red-100 text-red-700 border border-red-200 rounded-full px-2 py-0.5">
                    <ShieldAlert className="h-3 w-3" /> Review
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-600 mb-1 truncate">{flight.airline}</div>
              <div className="flex items-center gap-4 text-sm flex-wrap">
                <div className="flex items-center gap-1 text-gray-500">
                  <MapPin className="h-3.5 w-3.5 text-gray-400" />
                  <span>{flight.origin} → {flight.destination}</span>
                </div>
                <div className="flex items-center gap-1 text-gray-500">
                  <Clock className="h-3.5 w-3.5 text-gray-400" />
                  <span>{flight.actualTime}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Brain className="h-3.5 w-3.5 text-indigo-400" />
                  <span className={`text-xs font-medium ${flight.delayProb >= 60 ? 'text-red-600' : flight.delayProb >= 30 ? 'text-amber-600' : 'text-green-600'}`}>
                    {flight.delayProb}% delay risk
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right ml-3 flex-shrink-0">
              <div className="text-sm font-semibold text-gray-900">{flight.gate}</div>
              <div className="text-xs text-gray-500">{flight.terminal}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // ── Detail Panel Content ─────────────────────────────────────────────────────
  const renderDetailPanel = () => {
    if (!selectedFlight) return null;
    const status = getFlightStatus(selectedFlight);
    const timeline = generateTimeline({ ...selectedFlight, status });
    const checklist = selectedFlight.type === 'Departure' ? DEPARTURE_CHECKLIST : ARRIVAL_CHECKLIST;

    if (panelView === 'timeline') {
      return (
        <>
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => setPanelView('detail')}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <span className="text-sm font-semibold text-gray-800 ml-1">
              Flight Timeline — {selectedFlight.flightNumber}
            </span>
          </div>

          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
            <div className="space-y-0">
              {timeline.map((step, i) => {
                const isLast = i === timeline.length - 1;
                const dotColor =
                  step.status === 'completed' ? 'bg-green-500 border-green-500' :
                    step.status === 'current' ? 'bg-blue-500 border-blue-500 ring-4 ring-blue-100' :
                      step.status === 'delayed' ? 'bg-yellow-500 border-yellow-500' :
                        'bg-white border-gray-300';
                const labelColor =
                  step.status === 'completed' ? 'text-gray-600' :
                    step.status === 'current' ? 'text-blue-700 font-semibold' :
                      step.status === 'delayed' ? 'text-yellow-700' :
                        'text-gray-400';

                return (
                  <div key={i} className={`relative flex gap-4 ${isLast ? '' : 'pb-5'}`}>
                    <div className={`relative z-10 w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full border-2 ${dotColor} bg-white`}>
                      {step.status === 'completed' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                      {step.status === 'current' && <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />}
                      {step.status === 'delayed' && <AlertCircle className="h-4 w-4 text-yellow-500" />}
                      {step.status === 'pending' && <span className="w-2 h-2 rounded-full bg-gray-300" />}
                    </div>
                    <div className="flex-1 pt-1 pb-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-sm ${labelColor}`}>{step.label}</span>
                        <span className="text-xs text-gray-400 font-mono flex-shrink-0">{step.time}</span>
                      </div>
                      <p className={`text-xs mt-0.5 ${step.status === 'pending' ? 'text-gray-300' : 'text-gray-500'}`}>
                        {step.description}
                      </p>
                      {step.status === 'delayed' && (
                        <span className="inline-flex items-center gap-1 text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded px-1.5 py-0.5 mt-1">
                          <AlertCircle className="h-3 w-3" /> Delayed
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      );
    }

    if (panelView === 'status') {
      return (
        <>
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => setPanelView('detail')}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <span className="text-sm font-semibold text-gray-800 ml-1">Update Status</span>
          </div>

          <div className="mb-4 bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Current status</p>
            <Badge className={getStatusColor(status)}>{status}</Badge>
          </div>

          <p className="text-sm text-gray-600 mb-3">Select a new status for {selectedFlight.flightNumber}:</p>

          <div className="space-y-2">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleStatusUpdate(selectedFlight.id, opt.value)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border text-sm transition-colors ${opt.bg} ${opt.value === status ? 'opacity-50 cursor-default' : ''}`}
                disabled={opt.value === status}
              >
                <span className={`font-medium ${opt.color}`}>{opt.label}</span>
                <div className="flex items-center gap-2">
                  {opt.value === status && (
                    <span className="text-xs text-gray-400">Current</span>
                  )}
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </div>
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-4">
            Status changes are logged and visible to all stakeholders including the Manager Dashboard.
          </p>
        </>
      );
    }

    // Main Detail View
    return (
      <>
        <div className="mb-4">
          <div className="text-2xl font-bold mb-1">{selectedFlight.flightNumber}</div>
          <div className="text-sm text-gray-600 mb-2">{selectedFlight.airline}</div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={getStatusColor(status)}>{status}</Badge>
            <Badge variant="outline">{selectedFlight.type}</Badge>
            {selectedFlight.dispatchReview && (
              <span className="inline-flex items-center gap-1 text-xs bg-red-100 text-red-700 border border-red-200 rounded-full px-2 py-0.5">
                <ShieldAlert className="h-3 w-3" /> Dispatcher Review
              </span>
            )}
          </div>
        </div>

        <div className="mb-4 rounded-lg border border-indigo-100 bg-indigo-50 p-3">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="h-4 w-4 text-indigo-600" />
            <span className="text-xs font-semibold text-indigo-800">ML Prediction</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className={`text-base font-bold ${selectedFlight.delayProb >= 70 ? 'text-red-600' : selectedFlight.delayProb >= 40 ? 'text-amber-600' : 'text-green-600'}`}>
                {selectedFlight.delayProb}%
              </div>
              <div className="text-xs text-gray-500">Delay Risk</div>
            </div>
            <div>
              <div className="text-base font-bold text-indigo-700">{selectedFlight.confidence}%</div>
              <div className="text-xs text-gray-500">Confidence</div>
            </div>
            <div>
              <div className="text-xs font-semibold text-gray-700 mt-1">{selectedFlight.causeAttrib}</div>
              <div className="text-xs text-gray-500">Cause</div>
            </div>
          </div>
          {selectedFlight.confidence < 55 && (
            <p className="text-xs text-red-600 mt-2 bg-red-50 rounded p-1.5 border border-red-100">
              ⚠ Low confidence (&lt;55%) — human review recommended
            </p>
          )}
        </div>

        {status === 'Delayed' ? (
          <div className="space-y-3 mb-4">
            {selectedFlight.causeAttrib === 'Weather' ? (
              <div className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-1.5 bg-blue-50 rounded-lg">
                    <CloudRain className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 text-sm mb-0.5">Weather Disruption</h4>
                    <p className="text-xs text-gray-600">Model flagged high meteorological risk</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-50 rounded-lg p-2">
                    <div className="flex items-center gap-1.5 text-gray-500 mb-0.5"><Wind className="h-3 w-3" /><span className="text-xs">Wind</span></div>
                    <div className="text-sm font-semibold text-gray-900">Elevated</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <div className="flex items-center gap-1.5 text-gray-500 mb-0.5"><Eye className="h-3 w-3" /><span className="text-xs">Visibility</span></div>
                    <div className="text-sm font-semibold text-gray-900">Reduced</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 bg-orange-50 rounded-lg">
                    <Plane className="h-5 w-5 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 text-sm mb-0.5">{selectedFlight.causeAttrib}</h4>
                    <div className="bg-orange-50 rounded p-2 border-l-4 border-orange-400 mt-2">
                      <p className="text-xs text-gray-700">Flagged by predictive network routing algorithm.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            {status === 'On Time' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center mb-4">
                <CheckCircle2 className="h-7 w-7 text-green-600 mx-auto mb-1" />
                <p className="text-sm font-semibold text-green-900">On Schedule</p>
                <p className="text-xs text-green-700 mt-0.5">No delays reported</p>
              </div>
            )}
            {status === 'Boarding' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center mb-4">
                <Plane className="h-7 w-7 text-blue-600 mx-auto mb-1" />
                <p className="text-sm font-semibold text-blue-900">Boarding in Progress</p>
                <p className="text-xs text-blue-700 mt-0.5">Gate {selectedFlight.gate} — please monitor door status</p>
              </div>
            )}

            <div className="space-y-1 mb-4">
              {[
                ['Route', `${selectedFlight.origin} → ${selectedFlight.destination}`],
                ['Scheduled', selectedFlight.scheduledTime],
                ['Actual', selectedFlight.actualTime],
                ['Gate', selectedFlight.gate],
                ['Terminal', selectedFlight.terminal],
                ['Aircraft', selectedFlight.aircraft],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between py-1.5 border-b border-gray-100">
                  <span className="text-xs text-gray-500">{label}</span>
                  <span className="text-xs font-medium text-gray-900">{value}</span>
                </div>
              ))}
              <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                <span className="text-xs text-gray-500">Passengers</span>
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3 text-gray-400" />
                  <span className="text-xs font-medium text-gray-900">{selectedFlight.passengers}</span>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Ground Ops Checklist</p>
              <div className="space-y-1.5">
                {checklist.map((item) => (
                  <div
                    key={item.label}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs border ${item.done
                        ? 'bg-green-50 border-green-200 text-green-800'
                        : 'bg-gray-50 border-gray-200 text-gray-500'
                      }`}
                  >
                    <item.icon className={`h-3.5 w-3.5 ${item.done ? 'text-green-600' : 'text-gray-400'}`} />
                    <span className="flex-1">{item.label}</span>
                    {item.done ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <span className="text-xs text-gray-400">Pending</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="space-y-2 pt-2 border-t border-gray-100">
          <Button className="w-full" variant="default" onClick={() => setPanelView('status')}>
            <PackageCheck className="h-4 w-4 mr-2" />
            Update Status
          </Button>
          <Button className="w-full" variant="outline" onClick={() => setPanelView('timeline')}>
            <Clock className="h-4 w-4 mr-2" />
            View Timeline
          </Button>
        </div>
      </>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Ground Services Operations</h1>
        <p className="text-gray-600 mt-2">Real-time flight operations and gate assignments</p>
      </div>

      {dispatcherReviewFlights.length > 0 && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 flex items-start gap-3 overflow-x-auto">
          <ShieldAlert className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-red-800">ML Dispatcher Review — Flagged Flights</p>
            <div className="flex flex-wrap gap-2 mt-1.5 items-center">
              {visibleReviewFlights.map((p: any) => (
                <span
                  key={p.id}
                  className="text-xs bg-red-100 text-red-700 border border-red-200 rounded-full px-2.5 py-0.5 whitespace-nowrap"
                >
                  {p.flightNumber} · {p.confidence}% conf · {p.causeAttrib}
                </span>
              ))}

              {!isReviewExpanded && dispatcherReviewFlights.length > ALERT_DISPLAY_LIMIT && (
                <button
                  onClick={() => setIsReviewExpanded(true)}
                  className="inline-flex items-center text-xs text-red-800 font-medium px-2 py-0.5 hover:bg-red-200 rounded-full transition-colors"
                >
                  +{dispatcherReviewFlights.length - ALERT_DISPLAY_LIMIT} more...
                </button>
              )}
              {isReviewExpanded && dispatcherReviewFlights.length > ALERT_DISPLAY_LIMIT && (
                <button
                  onClick={() => setIsReviewExpanded(false)}
                  className="inline-flex items-center text-xs text-red-800 font-medium px-2 py-0.5 hover:bg-red-200 rounded-full transition-colors"
                >
                  Show less
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- Filters UI --- */}
      <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-gray-200 shadow-sm rounded-lg p-1">
            <Filter className="h-4 w-4 text-gray-500 ml-1" />
            <select
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
              className="text-xs border-none bg-transparent focus:ring-0 text-gray-700 font-medium cursor-pointer pl-1 pr-6 py-1"
            >
              <option value="All">All Statuses</option>
              <option value="On Time">On Time</option>
              <option value="Delayed">Delayed</option>
              <option value="Boarding">Boarding</option>
            </select>
          </div>

          <label className="flex items-center gap-2 text-xs font-medium text-gray-700 bg-white border border-gray-200 shadow-sm rounded-lg px-3 py-2 cursor-pointer hover:bg-gray-50 transition-colors">
            <input
              type="checkbox"
              checked={filterReview}
              onChange={(e) => { setFilterReview(e.target.checked); setCurrentPage(1); }}
              className="rounded text-indigo-600 focus:ring-indigo-500 border-gray-300"
            />
            Needs Review
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={(val) => { setActiveTab(val); setCurrentPage(1); }} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All ({activeFlights.length})</TabsTrigger>
              <TabsTrigger value="arrivals">Arrivals ({arrivals.length})</TabsTrigger>
              <TabsTrigger value="departures">Departures ({departures.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4">
              <div className="space-y-3">
                {paginatedList.map((f: any) => <FlightCard key={f.id} flight={f} />)}
                {paginatedList.length === 0 && (
                  <Card><CardContent className="py-8 text-center text-gray-400 text-sm">No active flights match your filters.</CardContent></Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="arrivals" className="mt-4">
              <div className="space-y-3">
                {paginatedList.map((f: any) => <FlightCard key={f.id} flight={f} />)}
                {paginatedList.length === 0 && (
                  <Card><CardContent className="py-8 text-center text-gray-400 text-sm">No active arrivals match your filters.</CardContent></Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="departures" className="mt-4">
              <div className="space-y-3">
                {paginatedList.map((f: any) => <FlightCard key={f.id} flight={f} />)}
                {paginatedList.length === 0 && (
                  <Card><CardContent className="py-8 text-center text-gray-400 text-sm">No active departures match your filters.</CardContent></Card>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Pagination Controls */}
          {currentList.length > ITEMS_PER_PAGE && (
            <div className="flex items-center justify-between px-4 py-4 mt-4 bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="text-sm text-gray-500">
                Showing <span className="font-medium">{(safeCurrentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="font-medium">{Math.min(safeCurrentPage * ITEMS_PER_PAGE, currentList.length)}</span> of <span className="font-medium">{currentList.length}</span> flights
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safeCurrentPage === 1}
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm text-gray-600 font-medium px-2">
                  Page {safeCurrentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safeCurrentPage === totalPages}
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        <div>
          {selectedFlight ? (
            <Card className="sticky top-4">
              <CardHeader className="pb-0">
                <CardTitle className="text-base">
                  {panelView === 'timeline'
                    ? 'Flight Timeline'
                    : panelView === 'status'
                      ? 'Update Status'
                      : getFlightStatus(selectedFlight) === 'Delayed'
                        ? 'Delay Details'
                        : 'Flight Details'}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 max-h-[calc(100vh-180px)] overflow-y-auto">
                {renderDetailPanel()}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Plane className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Select a flight to view details</p>
                <p className="text-xs text-gray-400 mt-1">Click any flight card to get started</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}