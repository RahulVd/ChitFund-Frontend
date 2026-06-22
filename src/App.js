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
  const [paymentVersion, setPaymentVersion] = useState(0); // ← ADD THIS

  const onPaymentChange = () => setPaymentVersion(v => v + 1); // ← ADD THIS

  return (
    <Router>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar selectedGroup={selectedGroup} />
        <div className="ml-56 flex-1 p-8">
          <Routes>
            <Route path="/" element={<ChitGroups setSelectedGroup={setSelectedGroup} />} />
            <Route path="/dashboard" element={<Dashboard selectedGroup={selectedGroup} paymentVersion={paymentVersion} />} /> {/* ← ADD paymentVersion */}
            <Route path="/members" element={<Members selectedGroup={selectedGroup} />} />
            <Route path="/payments" element={<Payments selectedGroup={selectedGroup} onPaymentChange={onPaymentChange} />} /> {/* ← ADD onPaymentChange */}
            <Route path="/auctions" element={<Auctions selectedGroup={selectedGroup} />} />
            <Route path="/summary" element={<Summary selectedGroup={selectedGroup} />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;