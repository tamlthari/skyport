import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { useMLAnalytics } from '../hooks/useMLAnalytics';
import {
  Plane, Clock, Users, AlertTriangle, CheckCircle, CloudRain, Wind,
  Eye, Droplets, Zap, Brain, ShieldAlert, TrendingUp, Activity, Loader2, XCircle,
  ChevronLeft, ChevronRight, Filter
} from 'lucide-react';

export default function ManagerDashboard() {
  const { data, loading } = useMLAnalytics();
  const [selectedFlight, setSelectedFlight] = useState<any | null>(null);

  // --- Pagination State ---
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  // --- Filter State ---
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterDirection, setFilterDirection] = useState('All');
  const [filterReview, setFilterReview] = useState(false);

  // --- NEW: Expandable Alert States ---
  const [isReviewExpanded, setIsReviewExpanded] = useState(false);
  const [isRiskExpanded, setIsRiskExpanded] = useState(false);
  const ALERT_DISPLAY_LIMIT = 15;

  if (loading || !data) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center text-gray-500 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        <p>Loading live operations data...</p>
      </div>
    );
  }

  // Extract live backend data
  const stats = data.overview.stats;
  const allFlights = data.liveFlights || [];

  // Filter for top alerts
  const predictedHighRisk = allFlights.filter((p: any) => p.delayProb >= 50);
  const dispatcherReviewFlights = allFlights.filter((p: any) => p.dispatchReview);

  // Determine visible alert items based on expansion state
  const visibleReviewFlights = isReviewExpanded
    ? dispatcherReviewFlights
    : dispatcherReviewFlights.slice(0, ALERT_DISPLAY_LIMIT);

  const visibleHighRiskFlights = isRiskExpanded
    ? predictedHighRisk
    : predictedHighRisk.slice(0, ALERT_DISPLAY_LIMIT);

  // --- Apply Filters ---
  const filteredFlights = allFlights.filter((flight: any) => {
    if (filterStatus !== 'All' && flight.status !== filterStatus) return false;
    if (filterReview && !flight.dispatchReview) return false;
    if (filterDirection === 'Departure' && flight.origin !== 'JFK') return false;
    if (filterDirection === 'Arrival' && flight.destination !== 'JFK') return false;
    return true;
  });

  // --- Pagination Math (Applied AFTER filters) ---
  const totalPages = Math.max(1, Math.ceil(filteredFlights.length / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedFlights = filteredFlights.slice(
    (safeCurrentPage - 1) * ITEMS_PER_PAGE,
    safeCurrentPage * ITEMS_PER_PAGE
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'On Time': return 'bg-green-100 text-green-800';
      case 'Delayed': return 'bg-yellow-100 text-yellow-800';
      case 'Boarding': return 'bg-blue-100 text-blue-800';
      case 'Departed': return 'bg-purple-100 text-purple-800';
      case 'Arrived': return 'bg-green-100 text-green-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Airport Manager Dashboard</h1>
        <p className="text-gray-600 mt-2">Real-time overview of airport operations</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Main Content (Left Side) ────────────────────────────────── */}
        <div className="lg:col-span-2">
          {/* ── KPI Cards ──────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Flights</CardTitle>
                <Plane className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalFlights}</div>
                <p className="text-xs text-gray-600 mt-1">Active today</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">On-Time Rate</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.onTimePercentage}%</div>
                <p className="text-xs text-gray-600 mt-1">Live model performance metric</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Passengers</CardTitle>
                <Users className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(stats.totalPassengers || 0).toLocaleString()}</div>
                <p className="text-xs text-gray-600 mt-1">Avg: {stats.avgPassengers}/flight</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Delays / Issues</CardTitle>
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.delayedFlights + stats.cancelledFlights}</div>
                <p className="text-xs text-gray-600 mt-1">
                  {stats.delayedFlights} delayed · {stats.cancelledFlights} cancelled
                </p>
              </CardContent>
            </Card>

            {/* ── ML Predicted Delays (Next 12 h) ── */}
            <Card className="border-indigo-200 bg-indigo-50/40">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-indigo-800">
                  Predicted High-Risk
                </CardTitle>
                <Brain className="h-4 w-4 text-indigo-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-indigo-700">{predictedHighRisk.length}</div>
                <p className="text-xs text-indigo-600 mt-1">
                  Flights &gt;50% delay risk · next 12 h
                </p>
                {dispatcherReviewFlights.length > 0 && (
                  <div className="flex items-center gap-1 mt-2">
                    <ShieldAlert className="h-3 w-3 text-red-500" />
                    <span className="text-xs text-red-600 font-medium">
                      {dispatcherReviewFlights.length} need dispatcher review
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ── Dispatcher Review Alert Strip ─────────────────────────────── */}
          {dispatcherReviewFlights.length > 0 && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 flex items-start gap-3">
              <ShieldAlert className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-800">
                  ML Dispatcher Review Required
                </p>
                <p className="text-xs text-red-700 mt-0.5">
                  The following flights have been flagged by the ML model due to low prediction confidence (&lt;55%).
                  Human review is recommended before making operational decisions.
                </p>
                <div className="flex flex-wrap gap-2 mt-2 items-center">
                  {visibleReviewFlights.map((p: any) => (
                    <span
                      key={p.id}
                      className="inline-flex items-center gap-1.5 text-xs bg-red-100 text-red-800 border border-red-200 rounded-full px-2.5 py-0.5"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      {p.flightNumber} · {p.origin}→{p.destination} · {p.confidence}% confidence
                    </span>
                  ))}

                  {/* EXPAND/COLLAPSE BUTTON */}
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

          {/* ── ML Predicted Delays Summary ──────────────────────────────── */}
          {predictedHighRisk.length > 0 && (
            <div className="mb-6 rounded-lg border border-indigo-200 bg-indigo-50/50 px-4 py-3 flex items-start gap-3">
              <Brain className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-semibold text-indigo-800">AI-Predicted Delays — Next 12 Hours</p>
                  <span className="text-xs bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-full px-2 py-0.5">
                    Active Model Prediction
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 mt-1 items-center">
                  {visibleHighRiskFlights.map((p: any) => (
                    <div
                      key={p.id}
                      className="inline-flex items-center gap-1.5 text-xs bg-white text-indigo-900 border border-indigo-200 rounded-lg px-2.5 py-1 shadow-sm"
                    >
                      <Activity className="h-3 w-3 text-indigo-500" />
                      <span className="font-medium">{p.flightNumber}</span>
                      <span className="text-gray-500">{p.origin}→{p.destination}</span>
                      <span className={`font-semibold ${p.delayProb >= 80 ? 'text-red-600' : 'text-amber-600'}`}>
                        {p.delayProb}%
                      </span>
                      {p.dispatchReview && (
                        <ShieldAlert className="h-3 w-3 text-red-500" />
                      )}
                    </div>
                  ))}

                  {/* EXPAND/COLLAPSE BUTTON */}
                  {!isRiskExpanded && predictedHighRisk.length > ALERT_DISPLAY_LIMIT && (
                    <button
                      onClick={() => setIsRiskExpanded(true)}
                      className="inline-flex items-center text-xs text-indigo-800 font-medium px-2 py-1 hover:bg-indigo-100 rounded-lg transition-colors"
                    >
                      +{predictedHighRisk.length - ALERT_DISPLAY_LIMIT} more...
                    </button>
                  )}
                  {isRiskExpanded && predictedHighRisk.length > ALERT_DISPLAY_LIMIT && (
                    <button
                      onClick={() => setIsRiskExpanded(false)}
                      className="inline-flex items-center text-xs text-indigo-800 font-medium px-2 py-1 hover:bg-indigo-100 rounded-lg transition-colors"
                    >
                      Show less
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Recent Flights Table (FILTERED & PAGINATED) ──────────────── */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <CardTitle>Flight Activity Log</CardTitle>

                {/* --- Filters UI --- */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg p-1">
                    <Filter className="h-4 w-4 text-gray-500 ml-1" />

                    <select
                      value={filterStatus}
                      onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                      className="text-xs border-none bg-transparent focus:ring-0 text-gray-700 font-medium cursor-pointer pl-1 pr-6 py-1"
                    >
                      <option value="All">All Statuses</option>
                      <option value="On Time">On Time</option>
                      <option value="Delayed">Delayed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>

                    <div className="w-px h-4 bg-gray-300"></div>

                    <select
                      value={filterDirection}
                      onChange={(e) => { setFilterDirection(e.target.value); setCurrentPage(1); }}
                      className="text-xs border-none bg-transparent focus:ring-0 text-gray-700 font-medium cursor-pointer pl-1 pr-6 py-1"
                    >
                      <option value="All">All Flights</option>
                      <option value="Departure">Departures</option>
                      <option value="Arrival">Arrivals</option>
                    </select>
                  </div>

                  <label className="flex items-center gap-2 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg px-3 py-2 cursor-pointer hover:bg-gray-50 transition-colors">
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
            </CardHeader>
            <CardContent className="p-0 sm:p-6 sm:pt-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-y border-gray-200 bg-gray-50/50">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Flight</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Airline</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Route</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Time</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Gate</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">ML Risk</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Passengers</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedFlights.length > 0 ? (
                      paginatedFlights.map((flight: any) => (
                        <tr
                          key={flight.id}
                          className={`border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${flight.dispatchReview ? 'bg-red-50/30' : ''
                            }`}
                          onClick={() => setSelectedFlight(flight)}
                        >
                          <td className="py-3 px-4 text-sm font-medium text-gray-900">
                            <div className="flex items-center gap-1.5">
                              {flight.flightNumber}
                              {flight.dispatchReview && (
                                <span title="Dispatcher Review Required" className="flex items-center">
                                  <ShieldAlert className="h-3.5 w-3.5 text-red-500" />
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">{flight.airline}</td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {flight.origin} → {flight.destination}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {flight.actualTime}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">{flight.gate}</td>
                          <td className="py-3 px-4">
                            <Badge className={getStatusColor(flight.status)}>{flight.status}</Badge>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5">
                              <div className="h-1.5 w-12 rounded-full bg-gray-100 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${flight.delayProb >= 70 ? 'bg-red-500' : flight.delayProb >= 40 ? 'bg-amber-500' : 'bg-green-500'
                                    }`}
                                  style={{ width: `${flight.delayProb}%` }}
                                />
                              </div>
                              <span className={`text-xs font-medium ${flight.delayProb >= 70 ? 'text-red-600' : flight.delayProb >= 40 ? 'text-amber-600' : 'text-green-600'}`}>
                                {flight.delayProb}%
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {flight.passengers}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-gray-500 text-sm">
                          No flights match your current filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls UI */}
              {filteredFlights.length > ITEMS_PER_PAGE && (
                <div className="flex items-center justify-between px-4 py-4 border-t border-gray-100 mt-2">
                  <div className="text-sm text-gray-500">
                    Showing <span className="font-medium">{(safeCurrentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="font-medium">{Math.min(safeCurrentPage * ITEMS_PER_PAGE, filteredFlights.length)}</span> of <span className="font-medium">{filteredFlights.length}</span> flights
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
            </CardContent>
          </Card>
        </div>

        {/* ── Right Panel (Delay Details) ───────────────────────────────── */}
        <div>
          {selectedFlight ? (
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="text-base">
                  {selectedFlight.status === 'Delayed' ? 'Delay Details' : 'Flight Details'}
                </CardTitle>
              </CardHeader>
              <CardContent className="max-h-[calc(100vh-180px)] overflow-y-auto">
                {/* Flight header */}
                <div className="mb-4">
                  <div className="text-xl font-bold text-gray-900 mb-1">
                    {selectedFlight.flightNumber}
                  </div>
                  <div className="text-sm text-gray-600 mb-2">{selectedFlight.airline}</div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={getStatusColor(selectedFlight.status)}>
                      {selectedFlight.status}
                    </Badge>
                    {selectedFlight.dispatchReview && (
                      <span className="inline-flex items-center gap-1 text-xs bg-red-100 text-red-700 border border-red-200 rounded-full px-2 py-0.5">
                        <ShieldAlert className="h-3 w-3" /> Review
                      </span>
                    )}
                  </div>
                </div>

                {/* ML Prediction Section */}
                <div className="mb-4 rounded-lg border border-indigo-200 bg-indigo-50 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="h-4 w-4 text-indigo-600" />
                    <span className="text-xs font-semibold text-indigo-800">ML Prediction</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className={`text-base font-bold ${selectedFlight.delayProb >= 70 ? 'text-red-600' : selectedFlight.delayProb >= 40 ? 'text-amber-600' : 'text-green-600'}`}>
                        {selectedFlight.delayProb}%
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">Delay Risk</div>
                    </div>
                    <div>
                      <div className="text-base font-bold text-indigo-700">{selectedFlight.confidence}%</div>
                      <div className="text-xs text-gray-500 mt-0.5">Confidence</div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-gray-700 mt-1">{selectedFlight.causeAttrib}</div>
                      <div className="text-xs text-gray-500 mt-0.5">Primary Cause</div>
                    </div>
                  </div>
                  {selectedFlight.confidence < 55 && (
                    <div className="mt-2 flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-2">
                      <ShieldAlert className="h-3.5 w-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-red-700">Low confidence (&lt;55%) — review recommended</p>
                    </div>
                  )}
                </div>

                {/* Content */}
                {selectedFlight.status === 'Delayed' ? (
                  <div className="space-y-3">
                    {/* Cause Detail Section based on ML Attribution */}
                    {selectedFlight.causeAttrib === 'Weather' ? (
                      <div className="border border-gray-200 rounded-lg p-3">
                        <div className="flex items-start gap-2 mb-3">
                          <div className="p-1.5 bg-blue-50 rounded-lg"><CloudRain className="h-5 w-5 text-blue-600" /></div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 text-sm mb-0.5">Weather Disruption</h4>
                            <p className="text-xs text-gray-600">Model flagged high meteorological risk</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-gray-50 rounded-lg p-2">
                            <div className="flex items-center gap-1.5 text-gray-600 mb-0.5"><Wind className="h-3 w-3" /><span className="text-xs">Wind</span></div>
                            <div className="text-sm font-semibold text-gray-900">Elevated</div>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-2">
                            <div className="flex items-center gap-1.5 text-gray-600 mb-0.5"><Eye className="h-3 w-3" /><span className="text-xs">Visibility</span></div>
                            <div className="text-sm font-semibold text-gray-900">Reduced</div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="border border-gray-200 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <div className="p-1.5 bg-orange-50 rounded-lg"><Plane className="h-5 w-5 text-orange-600" /></div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 text-sm mb-0.5">{selectedFlight.causeAttrib}</h4>
                            <div className="bg-orange-50 rounded p-2 border-l-4 border-orange-400 mt-2">
                              <p className="text-xs text-gray-700">Flagged by predictive network routing algorithm</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className={`bg-green-50 border border-green-200 rounded-lg p-3 text-center ${selectedFlight.status === 'Cancelled' ? 'bg-red-50 border-red-200' : ''}`}>
                      {selectedFlight.status === 'Cancelled' ? <XCircle className="h-7 w-7 text-red-600 mx-auto mb-1" /> : <CheckCircle className="h-7 w-7 text-green-600 mx-auto mb-1" />}
                      <p className={`font-semibold text-sm ${selectedFlight.status === 'Cancelled' ? 'text-red-900' : 'text-green-900'}`}>
                        {selectedFlight.status === 'Cancelled' ? 'Flight Cancelled' : 'Flight on schedule'}
                      </p>
                    </div>

                    <div className="space-y-1">
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
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Plane className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Select a flight to view details</p>
                <p className="text-xs text-gray-400 mt-1">Click any flight row to get started</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}