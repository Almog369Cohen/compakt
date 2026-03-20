"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Clock, CheckCircle, XCircle, AlertCircle, ExternalLink, Loader2 } from "lucide-react";

interface Subscription {
  id: string;
  profile_id: string;
  plan_key: string;
  status: string;
  started_at: string;
  expires_at: string;
  payment_reference: string | null;
  amount_paid: number | null;
  daysRemaining: number;
  isExpiringSoon: boolean;
  isExpiredToday: boolean;
  profile: {
    business_name: string;
    email: string;
    dj_slug: string | null;
  };
  coupon: {
    code: string;
    name: string;
  } | null;
}

export function SubscriptionsTab() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [approving, setApproving] = useState<string | null>(null);

  useEffect(() => {
    loadSubscriptions();
  }, [filter]);

  const loadSubscriptions = async () => {
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') {
        params.append('status', filter);
      }

      const response = await fetch(`/api/hq/subscriptions?${params}`);
      const data = await response.json();
      
      if (data.subscriptions) {
        setSubscriptions(data.subscriptions);
      }
    } catch (error) {
      console.error('Failed to load subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (subscriptionId: string) => {
    const paymentRef = prompt('הזן מספר אסמכתא/הזמנה:');
    if (!paymentRef) return;

    const amount = prompt('הזן סכום (אופציונלי):');

    setApproving(subscriptionId);
    try {
      const response = await fetch(`/api/hq/subscriptions/${subscriptionId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentReference: paymentRef,
          amount: amount ? parseFloat(amount) : null
        })
      });

      if (response.ok) {
        alert('המנוי אושר בהצלחה!');
        loadSubscriptions();
      } else {
        const data = await response.json();
        alert(`שגיאה: ${data.error}`);
      }
    } catch (error) {
      console.error('Failed to approve subscription:', error);
      alert('שגיאה באישור המנוי');
    } finally {
      setApproving(null);
    }
  };

  const handleExtend = async (subscriptionId: string) => {
    const days = prompt('כמה ימים להאריך?', '30');
    if (!days) return;

    const paymentRef = prompt('מספר אסמכתא (אופציונלי):');

    try {
      const response = await fetch(`/api/hq/subscriptions/${subscriptionId}/extend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          days: parseInt(days),
          paymentReference: paymentRef || null
        })
      });

      if (response.ok) {
        alert(`המנוי הוארך ב-${days} ימים!`);
        loadSubscriptions();
      } else {
        const data = await response.json();
        alert(`שגיאה: ${data.error}`);
      }
    } catch (error) {
      console.error('Failed to extend subscription:', error);
      alert('שגיאה בהארכת המנוי');
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; icon: any }> = {
      trial: { bg: 'bg-blue-100 text-blue-700', text: 'ניסיון', icon: Clock },
      active: { bg: 'bg-green-100 text-green-700', text: 'פעיל', icon: CheckCircle },
      expired: { bg: 'bg-red-100 text-red-700', text: 'פג תוקף', icon: XCircle },
      trial_expired: { bg: 'bg-orange-100 text-orange-700', text: 'ניסיון הסתיים', icon: AlertCircle },
    };

    const badge = badges[status] || badges.trial;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${badge.bg}`}>
        <Icon className="w-3 h-3" />
        {badge.text}
      </span>
    );
  };

  const expiringSoon = subscriptions.filter(s => s.isExpiringSoon || s.isExpiredToday);
  const trialsExpiring = expiringSoon.filter(s => s.status === 'trial');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[#059cc0]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alerts */}
      {trialsExpiring.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200"
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            <div>
              <p className="font-semibold text-orange-900">
                {trialsExpiring.length} trials מסתיימים בקרוב
              </p>
              <p className="text-sm text-orange-700">
                {trialsExpiring.filter(s => s.isExpiredToday).length} מסתיימים היום
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {['all', 'trial', 'active', 'expired'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === f
                ? 'bg-[#059cc0] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {f === 'all' ? 'הכל' : f === 'trial' ? 'ניסיון' : f === 'active' ? 'פעיל' : 'פג תוקף'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  שם עסק
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  סטטוס
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  נשארו
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  תשלום
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  פעולות
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    אין מנויים להצגה
                  </td>
                </tr>
              ) : (
                subscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">
                          {sub.profile.business_name}
                        </div>
                        <div className="text-sm text-gray-500">{sub.profile.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {sub.plan_key}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(sub.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        {sub.daysRemaining > 0 ? (
                          <span className={sub.isExpiringSoon ? 'text-orange-600 font-semibold' : 'text-gray-900'}>
                            {sub.daysRemaining} ימים
                          </span>
                        ) : (
                          <span className="text-red-600 font-semibold">פג תוקף</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(sub.expires_at).toLocaleDateString('he-IL')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {sub.payment_reference ? (
                        <div className="text-sm">
                          <div className="text-gray-900">{sub.payment_reference}</div>
                          {sub.amount_paid && (
                            <div className="text-gray-500">₪{sub.amount_paid}</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {sub.status === 'trial' && (
                          <button
                            onClick={() => handleApprove(sub.id)}
                            disabled={approving === sub.id}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50"
                          >
                            {approving === sub.id ? 'מאשר...' : 'אשר תשלום'}
                          </button>
                        )}
                        {sub.status === 'active' && (
                          <button
                            onClick={() => handleExtend(sub.id)}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                          >
                            הארך
                          </button>
                        )}
                        {sub.profile.dj_slug && (
                          <a
                            href={`/${sub.profile.dj_slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
          <div className="text-sm text-blue-600 mb-1">ניסיון</div>
          <div className="text-2xl font-bold text-blue-900">
            {subscriptions.filter(s => s.status === 'trial').length}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-green-50 border border-green-200">
          <div className="text-sm text-green-600 mb-1">פעיל</div>
          <div className="text-2xl font-bold text-green-900">
            {subscriptions.filter(s => s.status === 'active').length}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-orange-50 border border-orange-200">
          <div className="text-sm text-orange-600 mb-1">מסתיים בקרוב</div>
          <div className="text-2xl font-bold text-orange-900">
            {expiringSoon.length}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-red-50 border border-red-200">
          <div className="text-sm text-red-600 mb-1">פג תוקף</div>
          <div className="text-2xl font-bold text-red-900">
            {subscriptions.filter(s => s.status === 'expired' || s.status === 'trial_expired').length}
          </div>
        </div>
      </div>
    </div>
  );
}
