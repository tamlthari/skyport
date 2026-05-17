// Mock flight data for the airport system

export interface Flight {
  id: string;
  flightNumber: string;
  airline: string;
  origin: string;
  destination: string;
  status: 'On Time' | 'Delayed' | 'Boarding' | 'Departed' | 'Arrived' | 'Cancelled';
  scheduledTime: string;
  actualTime: string;
  gate: string;
  terminal: string;
  aircraft: string;
  passengers: number;
  type: 'Arrival' | 'Departure';
}

export const flights: Flight[] = [
  {
    id: '1',
    flightNumber: 'AA123',
    airline: 'American Airlines',
    origin: 'JFK',
    destination: 'LAX',
    status: 'On Time',
    scheduledTime: '08:30',
    actualTime: '08:30',
    gate: 'A12',
    terminal: 'Terminal 1',
    aircraft: 'Boeing 737',
    passengers: 156,
    type: 'Departure',
  },
  {
    id: '2',
    flightNumber: 'DL456',
    airline: 'Delta Airlines',
    origin: 'ORD',
    destination: 'JFK',
    status: 'Boarding',
    scheduledTime: '09:15',
    actualTime: '09:15',
    gate: 'B5',
    terminal: 'Terminal 2',
    aircraft: 'Airbus A320',
    passengers: 142,
    type: 'Arrival',
  },
  {
    id: '3',
    flightNumber: 'UA789',
    airline: 'United Airlines',
    origin: 'JFK',
    destination: 'SFO',
    status: 'Delayed',
    scheduledTime: '10:00',
    actualTime: '10:45',
    gate: 'C8',
    terminal: 'Terminal 3',
    aircraft: 'Boeing 777',
    passengers: 289,
    type: 'Departure',
  },
  {
    id: '4',
    flightNumber: 'BA234',
    airline: 'British Airways',
    origin: 'LHR',
    destination: 'JFK',
    status: 'Arrived',
    scheduledTime: '11:30',
    actualTime: '11:25',
    gate: 'D3',
    terminal: 'Terminal 4',
    aircraft: 'Boeing 787',
    passengers: 214,
    type: 'Arrival',
  },
  {
    id: '5',
    flightNumber: 'SW567',
    airline: 'Southwest',
    origin: 'JFK',
    destination: 'DEN',
    status: 'On Time',
    scheduledTime: '12:00',
    actualTime: '12:00',
    gate: 'A7',
    terminal: 'Terminal 1',
    aircraft: 'Boeing 737',
    passengers: 175,
    type: 'Departure',
  },
  {
    id: '6',
    flightNumber: 'LH890',
    airline: 'Lufthansa',
    origin: 'FRA',
    destination: 'JFK',
    status: 'On Time',
    scheduledTime: '13:45',
    actualTime: '13:45',
    gate: 'E2',
    terminal: 'Terminal 4',
    aircraft: 'Airbus A380',
    passengers: 412,
    type: 'Arrival',
  },
  {
    id: '7',
    flightNumber: 'AA345',
    airline: 'American Airlines',
    origin: 'JFK',
    destination: 'MIA',
    status: 'Departed',
    scheduledTime: '14:20',
    actualTime: '14:18',
    gate: 'B11',
    terminal: 'Terminal 2',
    aircraft: 'Boeing 737',
    passengers: 168,
    type: 'Departure',
  },
  {
    id: '8',
    flightNumber: 'AF123',
    airline: 'Air France',
    origin: 'CDG',
    destination: 'JFK',
    status: 'Delayed',
    scheduledTime: '15:00',
    actualTime: '16:30',
    gate: 'D9',
    terminal: 'Terminal 4',
    aircraft: 'Boeing 777',
    passengers: 267,
    type: 'Arrival',
  },
  {
    id: '9',
    flightNumber: 'JB678',
    airline: 'JetBlue',
    origin: 'JFK',
    destination: 'BOS',
    status: 'Boarding',
    scheduledTime: '16:30',
    actualTime: '16:30',
    gate: 'C4',
    terminal: 'Terminal 3',
    aircraft: 'Airbus A320',
    passengers: 134,
    type: 'Departure',
  },
  {
    id: '10',
    flightNumber: 'EK456',
    airline: 'Emirates',
    origin: 'DXB',
    destination: 'JFK',
    status: 'On Time',
    scheduledTime: '17:15',
    actualTime: '17:15',
    gate: 'E8',
    terminal: 'Terminal 4',
    aircraft: 'Airbus A380',
    passengers: 489,
    type: 'Arrival',
  },
  {
    id: '11',
    flightNumber: 'DL234',
    airline: 'Delta Airlines',
    origin: 'JFK',
    destination: 'ATL',
    status: 'Cancelled',
    scheduledTime: '18:00',
    actualTime: '--',
    gate: '--',
    terminal: 'Terminal 2',
    aircraft: 'Boeing 737',
    passengers: 0,
    type: 'Departure',
  },
  {
    id: '12',
    flightNumber: 'QR789',
    airline: 'Qatar Airways',
    origin: 'DOH',
    destination: 'JFK',
    status: 'On Time',
    scheduledTime: '19:30',
    actualTime: '19:30',
    gate: 'E5',
    terminal: 'Terminal 4',
    aircraft: 'Boeing 777',
    passengers: 312,
    type: 'Arrival',
  },
];

// Analytics data for Data Scientist view
export const getFlightStatistics = () => {
  const totalFlights = flights.length;
  const onTimeFlights = flights.filter(f => f.status === 'On Time' || f.status === 'Arrived').length;
  const delayedFlights = flights.filter(f => f.status === 'Delayed').length;
  const cancelledFlights = flights.filter(f => f.status === 'Cancelled').length;
  const totalPassengers = flights.reduce((sum, f) => sum + f.passengers, 0);
  const avgPassengers = Math.round(totalPassengers / totalFlights);

  return {
    totalFlights,
    onTimeFlights,
    delayedFlights,
    cancelledFlights,
    totalPassengers,
    avgPassengers,
    onTimePercentage: Math.round((onTimeFlights / totalFlights) * 100),
  };
};

// Hourly flight distribution for charts
export const getHourlyDistribution = () => {
  const hours = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];
  
  return hours.map((hour, index) => ({
    hour,
    arrivals: Math.floor(Math.random() * 5) + 1,
    departures: Math.floor(Math.random() * 5) + 1,
  }));
};

// Status distribution for pie charts
export const getStatusDistribution = () => {
  const stats = getFlightStatistics();
  return [
    { name: 'On Time', value: stats.onTimeFlights, fill: '#22c55e' },
    { name: 'Delayed', value: stats.delayedFlights, fill: '#f59e0b' },
    { name: 'Cancelled', value: stats.cancelledFlights, fill: '#ef4444' },
  ];
};

// Airline performance data
export const getAirlinePerformance = () => {
  const airlines = ['American Airlines', 'Delta Airlines', 'United Airlines', 'British Airways', 'Lufthansa'];
  
  return airlines.map(airline => ({
    airline,
    onTime: Math.floor(Math.random() * 20) + 10,
    delayed: Math.floor(Math.random() * 8) + 1,
    cancelled: Math.floor(Math.random() * 3),
  }));
};
