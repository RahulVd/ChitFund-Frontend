import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import Payments from './pages/Payments';
import Auctions from './pages/Auctions';
import Summary from './pages/Summary';
import ChitGroups from './pages/ChitGroups';

function App() {
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [paymentVersion, setPaymentVersion] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const onPaymentChange = () => setPaymentVersion(v => v + 1);

  return (
    <Router>
      <div className="flex min-h-screen bg-gray-50">
        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md border border-gray-200"
        >
          {sidebarOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>

        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar - Hidden on mobile, visible on desktop */}
        <div
          className={`fixed lg:static top-0 left-0 h-screen w-56 z-40 transition-transform duration-300 lg:transform-none ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <Sidebar selectedGroup={selectedGroup} onClose={() => setSidebarOpen(false)} />
        </div>

        {/* Main Content */}
        <div className="flex-1 w-full lg:w-auto">
          <div className="pt-16 lg:pt-0 px-4 lg:px-8 py-4 lg:py-8">
            <Routes>
              <Route path="/" element={<ChitGroups setSelectedGroup={setSelectedGroup} />} />
              <Route path="/dashboard" element={<Dashboard selectedGroup={selectedGroup} paymentVersion={paymentVersion} />} />
              <Route path="/members" element={<Members selectedGroup={selectedGroup} />} />
              <Route path="/payments" element={<Payments selectedGroup={selectedGroup} onPaymentChange={onPaymentChange} />} />
              <Route path="/auctions" element={<Auctions selectedGroup={selectedGroup} />} />
              <Route path="/summary" element={<Summary selectedGroup={selectedGroup} />} />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;
