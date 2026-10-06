/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import {
  X,
  GraduationCap,
  Layers,
  Database,
  CalendarCheck,
  Code2,
  CheckCircle2,
  Table,
  Play,
  ArrowRight,
} from 'lucide-react';

interface VivaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VivaModal: React.FC<VivaModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'oops' | 'rdbms' | 'availability' | 'queries'>('oops');
  const [sqlQueries, setSqlQueries] = useState<any[]>([]);
  const [loadingQueries, setLoadingQueries] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadQueries();
    }
  }, [isOpen]);

  const loadQueries = async () => {
    setLoadingQueries(true);
    try {
      const res = await api.getVivaSQLShowcase();
      setSqlQueries(res.queries);
    } catch (err) {
      console.error('Failed to load SQL queries showcase:', err);
    } finally {
      setLoadingQueries(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="bg-[#14141e] text-white px-6 py-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#0460ea]/20 text-[#379bf0] border border-[#0460ea]/30 flex items-center justify-center">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-xl font-bold">StayEase Academic Architecture & Viva Guide</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#0460ea] text-white">
                  OOPS + RDBMS
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Detailed design documentation for examiners, professors, and project evaluation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 gap-2 pt-2">
          <button
            onClick={() => setActiveTab('oops')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-colors flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'oops'
                ? 'bg-white text-indigo-900 border-t border-x border-slate-200 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-indigo-600" />
            <span>1. OOPS Architecture</span>
          </button>

          <button
            onClick={() => setActiveTab('rdbms')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-colors flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'rdbms'
                ? 'bg-white text-indigo-900 border-t border-x border-slate-200 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-emerald-600" />
            <span>2. 3NF Relational Schema</span>
          </button>

          <button
            onClick={() => setActiveTab('availability')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-colors flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'availability'
                ? 'bg-white text-indigo-900 border-t border-x border-slate-200 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CalendarCheck className="w-3.5 h-3.5 text-amber-600" />
            <span>3. Booking Overlap Logic</span>
          </button>

          <button
            onClick={() => setActiveTab('queries')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-colors flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'queries'
                ? 'bg-white text-indigo-900 border-t border-x border-slate-200 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Code2 className="w-3.5 h-3.5 text-rose-600" />
            <span>4. Live SQL Queries Showcase</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* TAB 1: OOPS ARCHITECTURE */}
          {activeTab === 'oops' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100">
                <h4 className="font-bold text-sm text-indigo-950 mb-1">
                  Object-Oriented Programming (OOPS) Principles Demonstrated
                </h4>
                <p className="text-xs text-indigo-900/80 leading-relaxed">
                  The backend domain is structured around TypeScript classes emphasizing the 4 core pillars of OOP:
                  Encapsulation, Abstraction, Inheritance, and Polymorphism.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* User Hierarchy */}
                <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Class Hierarchy 1</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                      User Hierarchy
                    </span>
                  </div>
                  <h5 className="font-display font-bold text-base text-slate-900">User → Customer & Admin</h5>
                  
                  <div className="font-mono text-xs bg-slate-900 text-slate-100 p-3 rounded-xl space-y-1">
                    <div className="text-amber-400">abstract class User &#123;</div>
                    <div className="pl-4 text-slate-300">protected _userId: number;</div>
                    <div className="pl-4 text-slate-300">abstract getDashboardUrl(): string;</div>
                    <div className="pl-4 text-slate-300">abstract getPermissions(): string[];</div>
                    <div className="text-amber-400">&#125;</div>
                    <div className="text-emerald-400 mt-2">class Customer extends User &#123; ... &#125;</div>
                    <div className="text-sky-400">class Admin extends User &#123; ... &#125;</div>
                  </div>

                  <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4">
                    <li><strong>Abstraction:</strong> `User` is an abstract base class that cannot be instantiated directly.</li>
                    <li><strong>Encapsulation:</strong> Private and protected attributes with strictly controlled getters.</li>
                    <li><strong>Polymorphism:</strong> `getDashboardUrl()` returns `/customer/bookings` for Customer and `/admin/dashboard` for Admin.</li>
                  </ul>
                </div>

                {/* Payment Hierarchy */}
                <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Class Hierarchy 2</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      Payment Polymorphism
                    </span>
                  </div>
                  <h5 className="font-display font-bold text-base text-slate-900">Payment → Cash & DemoCard</h5>
                  
                  <div className="font-mono text-xs bg-slate-900 text-slate-100 p-3 rounded-xl space-y-1">
                    <div className="text-amber-400">abstract class Payment &#123;</div>
                    <div className="pl-4 text-slate-300">abstract processPayment(): Promise&lt;Result&gt;;</div>
                    <div className="pl-4 text-slate-300">abstract getReceiptSummary(): Record;</div>
                    <div className="text-amber-400">&#125;</div>
                    <div className="text-emerald-400 mt-2">class CashPayment extends Payment &#123;</div>
                    <div className="pl-4 text-slate-400">// Sets status 'Pending', payable at check-in</div>
                    <div className="text-emerald-400">&#125;</div>
                    <div className="text-sky-400 mt-1">class DemoCardPayment extends Payment &#123;</div>
                    <div className="pl-4 text-slate-400">// Tokenizes card, validates, completes payment</div>
                    <div className="text-sky-400">&#125;</div>
                  </div>

                  <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4">
                    <li><strong>Polymorphic Dispatch:</strong> The booking engine invokes `payment.processPayment()` without knowing the concrete payment type.</li>
                    <li><strong>Encapsulation:</strong> Card details and authorization tokens are encapsulated securely.</li>
                  </ul>
                </div>

              </div>

              {/* Other OOPS Entities */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-3">
                <h5 className="font-display font-bold text-sm text-slate-900">Domain Aggregates & Singleton Patterns</h5>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="font-bold text-slate-900 mb-1">Hotel Singleton</div>
                    <div className="text-slate-600">Guarantees a single source of truth for hotel policies, tax rates (12% GST), currency (₹), and contact metadata.</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="font-bold text-slate-900 mb-1">Booking Aggregate</div>
                    <div className="text-slate-600">Encapsulates reservation lifecycles, date calculations, room items, service items, and cancellation rules.</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="font-bold text-slate-900 mb-1">HotelService Model</div>
                    <div className="text-slate-600">Dynamically computes charges depending on `chargeType` (`per_day * nights`, `per_person * guests`, or `per_booking`).</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: 3NF RELATIONAL SCHEMA */}
          {activeTab === 'rdbms' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                <h4 className="font-bold text-sm text-emerald-950 mb-1">
                  Third Normal Form (3NF) Relational Database Design
                </h4>
                <p className="text-xs text-emerald-900/80 leading-relaxed">
                  The database schema is strictly normalized to 3NF. There are NO repeating groups (1NF satisfied), NO partial dependencies on composite primary keys (2NF satisfied), and NO transitive dependencies (3NF satisfied).
                </p>
              </div>

              {/* Relational Tables Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                
                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                  <div className="font-bold text-slate-900 flex items-center justify-between">
                    <span>users</span>
                    <span className="font-mono text-[10px] text-slate-400">Base Entity</span>
                  </div>
                  <div className="text-slate-600 font-mono space-y-1 text-[11px]">
                    <div><strong className="text-amber-700">PK:</strong> user_id (INT)</div>
                    <div>email (VARCHAR, UNIQUE)</div>
                    <div>password_hash, phone, role</div>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                  <div className="font-bold text-slate-900 flex items-center justify-between">
                    <span>customers & admins</span>
                    <span className="font-mono text-[10px] text-slate-400">1:1 Subtypes</span>
                  </div>
                  <div className="text-slate-600 font-mono space-y-1 text-[11px]">
                    <div><strong className="text-amber-700">PK/FK:</strong> customer_id → users</div>
                    <div>address, city, loyalty_points</div>
                    <div><strong className="text-amber-700">PK/FK:</strong> admin_id → users</div>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                  <div className="font-bold text-slate-900 flex items-center justify-between">
                    <span>room_types & rooms</span>
                    <span className="font-mono text-[10px] text-slate-400">1:N Category</span>
                  </div>
                  <div className="text-slate-600 font-mono space-y-1 text-[11px]">
                    <div><strong className="text-amber-700">PK:</strong> room_type_id (Master)</div>
                    <div><strong className="text-amber-700">PK:</strong> room_id, room_number</div>
                    <div><strong className="text-sky-700">FK:</strong> room_type_id → room_types</div>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                  <div className="font-bold text-slate-900 flex items-center justify-between">
                    <span>room_type_amenities</span>
                    <span className="font-mono text-[10px] text-emerald-600">Junction (M:N)</span>
                  </div>
                  <div className="text-slate-600 font-mono space-y-1 text-[11px]">
                    <div><strong className="text-amber-700">Composite PK:</strong> (room_type_id, amenity_id)</div>
                    <div>Prevents multi-valued repeating column attributes in room_types.</div>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                  <div className="font-bold text-slate-900 flex items-center justify-between">
                    <span>bookings & booking_rooms</span>
                    <span className="font-mono text-[10px] text-emerald-600">Junction (M:N)</span>
                  </div>
                  <div className="text-slate-600 font-mono space-y-1 text-[11px]">
                    <div><strong className="text-amber-700">PK:</strong> booking_id</div>
                    <div><strong className="text-sky-700">FK:</strong> customer_id → users</div>
                    <div><strong className="text-amber-700">Composite PK:</strong> (booking_id, room_id)</div>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                  <div className="font-bold text-slate-900 flex items-center justify-between">
                    <span>booking_services & payments</span>
                    <span className="font-mono text-[10px] text-slate-400">Relational Ledger</span>
                  </div>
                  <div className="text-slate-600 font-mono space-y-1 text-[11px]">
                    <div><strong className="text-amber-700">Composite PK:</strong> (booking_id, service_id)</div>
                    <div><strong className="text-amber-700">PK:</strong> payment_id</div>
                    <div><strong className="text-sky-700">FK:</strong> booking_id → bookings</div>
                  </div>
                </div>

              </div>

              {/* Constraints & Referential Integrity */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="font-bold text-xs text-slate-800 uppercase tracking-wider">Referential Integrity & Constraints</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600">
                  <div className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>ON DELETE CASCADE:</strong> Deleting a booking automatically removes linked junction entries in `booking_rooms`, `booking_services`, and `payments`.</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>CHECK Constraints:</strong> Enforces `check_out_date &gt; check_in_date`, `base_price &gt;= 0`, and `max_occupancy &gt; 0`.</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>UNIQUE Indexes:</strong> Enforces unique constraint on `email`, `room_number`, and `booking_reference`.</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Parameterized SQL:</strong> All queries use parameterized placeholders (`?`) preventing SQL Injection vulnerabilities.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BOOKING AVAILABILITY LOGIC */}
          {activeTab === 'availability' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                <h4 className="font-bold text-sm text-amber-950 mb-1">
                  Mathematical Date-Overlap Availability Formula
                </h4>
                <p className="text-xs text-amber-900/80 leading-relaxed">
                  To prevent double booking without race conditions, availability is computed authoritative on the database layer using interval overlap logic.
                </p>
              </div>

              <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-4">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">The Interval Intersection Theorem</div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  Two date intervals <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-amber-700">[CheckIn_A, CheckOut_A)</code> and <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-amber-700">[CheckIn_B, CheckOut_B)</code> overlap if and only if:
                </p>
                <div className="p-4 rounded-xl bg-slate-900 text-amber-400 font-mono text-sm text-center">
                  (Booking.check_in_date &lt; Requested_CheckOut) AND (Booking.check_out_date &gt; Requested_CheckIn)
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600 pt-2">
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="font-bold text-slate-800 mb-1">Case 1: Fully Enclosed</div>
                    <div>Requested: Oct 10 - Oct 15<br />Existing: Oct 12 - Oct 14<br /><strong className="text-red-600">Overlap = Unavailable</strong></div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="font-bold text-slate-800 mb-1">Case 2: Overlapping Start</div>
                    <div>Requested: Oct 10 - Oct 15<br />Existing: Oct 08 - Oct 12<br /><strong className="text-red-600">Overlap = Unavailable</strong></div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="font-bold text-slate-800 mb-1">Case 3: Adjacent (Back-to-Back)</div>
                    <div>Requested: Oct 10 - Oct 15<br />Existing: Oct 15 - Oct 18<br /><strong className="text-emerald-600">Valid = Available</strong></div>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="text-xs font-bold text-slate-800 mb-1.5">Executed SQL Subquery:</div>
                  <pre className="p-3 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto">
{`SELECT r.room_id, r.room_number, rt.name 
FROM rooms r
JOIN room_types rt ON r.room_type_id = rt.room_type_id
WHERE r.status != 'Maintenance'
  AND r.room_id NOT IN (
    SELECT br.room_id 
    FROM booking_rooms br
    JOIN bookings b ON br.booking_id = b.booking_id
    WHERE b.booking_status NOT IN ('Cancelled')
      AND b.check_in_date < ?
      AND b.check_out_date > ?
  );`}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: LIVE SQL QUERIES SHOWCASE */}
          {activeTab === 'queries' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-rose-950 mb-1">
                    Live SQL Queries Execution Showcase
                  </h4>
                  <p className="text-xs text-rose-900/80">
                    These queries are executed in real time against the backend database to demonstrate SQL features during viva defense.
                  </p>
                </div>
                <button
                  onClick={loadQueries}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center space-x-1 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Re-Execute All</span>
                </button>
              </div>

              {loadingQueries ? (
                <div className="text-center py-12 text-slate-400 text-sm">Executing SQL queries on database engine...</div>
              ) : (
                <div className="space-y-6">
                  {sqlQueries.map((q, idx) => (
                    <div key={q.id} className="p-5 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-700">Query #{idx + 1}: {q.title}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {q.concept}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">{q.description}</p>
                      
                      <div>
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">SQL Statement</div>
                        <pre className="p-3 rounded-xl bg-slate-900 text-amber-400 font-mono text-xs overflow-x-auto whitespace-pre-wrap">
                          {q.sql}
                        </pre>
                      </div>

                      <div>
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Live Results ({q.result?.length || 0} rows returned)
                        </div>
                        <div className="overflow-x-auto border border-slate-200 rounded-xl">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-100 border-b border-slate-200 text-slate-700">
                              <tr>
                                {q.result && q.result[0] && Object.keys(q.result[0]).map((col) => (
                                  <th key={col} className="px-3 py-2 font-bold font-mono text-[11px]">
                                    {col}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {q.result && q.result.map((row: any, rIdx: number) => (
                                <tr key={rIdx} className="hover:bg-slate-50 font-mono text-[11px]">
                                  {Object.values(row).map((val: any, cIdx: number) => (
                                    <td key={cIdx} className="px-3 py-2 text-slate-800">
                                      {String(val ?? 'NULL')}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between text-xs text-slate-500">
          <span>StayEase Hotel Management Engine • OOPS + RDBMS Architecture</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
