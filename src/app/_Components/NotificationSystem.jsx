import React, { useState, useEffect } from 'react';
import { Bell, Plus, X, Calendar, Edit2, Trash2, Mail, MessageSquare, Smartphone } from 'lucide-react';
import { collection, addDoc, getDocs, onSnapshot, serverTimestamp, deleteDoc, doc, setDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';

const NotificationSystem = ({ db }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedChannel, setSelectedChannel] = useState('email');
  const [selectedRecipients, setSelectedRecipients] = useState([]);
  const [messageType, setMessageType] = useState('template');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [scheduleType, setScheduleType] = useState('now');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [subject, setSubject] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  
  const [templates, setTemplates] = useState([]);
  const [scheduledNotifications, setScheduledNotifications] = useState([]);
  const [notificationHistory, setNotificationHistory] = useState([]);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateCategory, setTemplateCategory] = useState('');
  const [templateContent, setTemplateContent] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  const [emailConfig, setEmailConfig] = useState({ is_configured: false });
  const [smsConfig, setSmsConfig] = useState({ is_configured: false });
  const [pushConfig, setPushConfig] = useState({ is_configured: false });
  
  const [recipientGroups, setRecipientGroups] = useState([
    { id: 'all', label: 'All Users', count: 0 },
    { id: 'admin', label: 'All Academy admin', count: 0 },
    { id: 'coach', label: 'All Head Coach', count: 0 }
  ]);

  // Load configs from Firebase
  useEffect(() => {
    if (!db) return;

    const unsubscribers = [];

    const emailDocRef = doc(db, 'notification_config', 'email');
    const unsub1 = onSnapshot(emailDocRef, (snap) => {
      if (snap.exists()) setEmailConfig(snap.data());
    });
    unsubscribers.push(unsub1);

    const smsDocRef = doc(db, 'notification_config', 'sms');
    const unsub2 = onSnapshot(smsDocRef, (snap) => {
      if (snap.exists()) setSmsConfig(snap.data());
    });
    unsubscribers.push(unsub2);

    const pushDocRef = doc(db, 'notification_config', 'push');
    const unsub3 = onSnapshot(pushDocRef, (snap) => {
      if (snap.exists()) setPushConfig(snap.data());
    });
    unsubscribers.push(unsub3);

    return () => unsubscribers.forEach(unsub => unsub());
  }, [db]);

  // Load templates, scheduled notifications, and history
  useEffect(() => {
    if (!db) return;

    const unsubscribers = [];

    const unsub1 = onSnapshot(collection(db, 'notification_templates'), (snap) => {
      setTemplates(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    unsubscribers.push(unsub1);

    const unsub2 = onSnapshot(collection(db, 'scheduled_notifications'), (snap) => {
      setScheduledNotifications(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    unsubscribers.push(unsub2);

    const unsub3 = onSnapshot(collection(db, 'notification_history'), (snap) => {
      setNotificationHistory(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    unsubscribers.push(unsub3);

    return () => unsubscribers.forEach(unsub => unsub());
  }, [db]);

  // Load recipient counts from Firebase
  useEffect(() => {
    if (!db) return;

    const fetchRecipientStats = async () => {
      try {
        const orgsRef = collection(db, "organizations");
        const orgsSnapshot = await getDocs(orgsRef);

        let totalAllUsers = 0;
        let totalHeadCoaches = 0;
        let totalAdmins = 0;

        for (const orgDoc of orgsSnapshot.docs) {
          const orgId = orgDoc.id;
          const gymsRef = collection(db, `organizations/${orgId}/gyms`);
          const gymsSnapshot = await getDocs(gymsRef);

          for (const gymDoc of gymsSnapshot.docs) {
            const gymId = gymDoc.id;
            const gymData = gymDoc.data();

            const headCoachesRef = collection(db, `organizations/${orgId}/gyms/${gymId}/headCoaches`);
            const headCoachSnapshot = await getDocs(headCoachesRef);
            totalHeadCoaches += headCoachSnapshot.size;

            const allUsersRef = collection(db, `organizations/${orgId}/gyms/${gymId}/allUsers`);
            const allUsersSnapshot = await getDocs(allUsersRef);
            const studentsCount = allUsersSnapshot.size;

            if (gymData.email) totalAdmins += 1;

            totalAllUsers += studentsCount + headCoachSnapshot.size + (gymData.email ? 1 : 0);
          }
        }

        setRecipientGroups([
          { id: 'all', label: 'All Users', count: totalAllUsers },
          { id: 'admin', label: 'All Academy admin', count: totalAdmins },
          { id: 'coach', label: 'All Head Coach', count: totalHeadCoaches }
        ]);
      } catch (error) {
        console.error("Error fetching recipient stats:", error);
        toast.error('Failed to load recipient counts');
      }
    };

    fetchRecipientStats();
  }, [db]);

  const handleSendNotification = async () => {
    if (!subject) {
      toast.error('Please enter a subject');
      return;
    }
    if (selectedRecipients.length === 0) {
      toast.error('Please select recipients');
      return;
    }

    try {
      const payload = {
        channel: selectedChannel,
        recipients: selectedRecipients,
        subject: subject,
        messageType: messageType,
        templateId: messageType === 'template' ? selectedTemplate : null,
        customMessage: messageType === 'custom' ? customMessage : null,
        scheduleType: scheduleType,
        scheduleDate: scheduleType === 'later' ? scheduleDate : null,
        scheduleTime: scheduleType === 'later' ? scheduleTime : null,
        status: scheduleType === 'later' ? 'Scheduled' : 'Pending',
        createdAt: serverTimestamp()
      };

      if (scheduleType === 'later') {
        await addDoc(collection(db, 'scheduled_notifications'), payload);
        toast.success('Notification scheduled!');
      } else {
        await addDoc(collection(db, 'notification_history'), {
          ...payload,
          status: 'Delivered',
          sentAt: serverTimestamp()
        });
        toast.success('Notification sent!');
      }

      // Reset form
      setSelectedRecipients([]);
      setSubject('');
      setCustomMessage('');
      setSelectedTemplate('');
      setActiveTab('dashboard');
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error('Failed to send notification');
    }
  };

  const handleSaveTemplate = async () => {
    if (!templateName || !templateCategory || !templateContent) {
      toast.error('Please fill all template fields');
      return;
    }

    try {
      await addDoc(collection(db, 'notification_templates'), {
        name: templateName,
        category: templateCategory,
        content: templateContent,
        createdAt: serverTimestamp()
      });
      toast.success('Template created!');
      setTemplateModalOpen(false);
      setTemplateName('');
      setTemplateCategory('');
      setTemplateContent('');
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save template');
    }
  };

  const handleDeleteScheduled = async (id) => {
    if (window.confirm('Delete this scheduled notification?')) {
      try {
        await deleteDoc(doc(db, 'scheduled_notifications', id));
        toast.success('Notification deleted');
      } catch (error) {
        console.error('Error deleting:', error);
        toast.error('Failed to delete');
      }
    }
  };

  const stats = {
    totalSent: notificationHistory.length,
    delivered: notificationHistory.filter(n => n.status === 'Delivered').length
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Delivered': return 'bg-green-100 text-green-700';
      case 'Pending': return 'bg-yellow-100 text-yellow-700';
      case 'Failed': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50">
      <div className="p-6 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Bell className="w-8 h-8 text-blue-600" />
              Notifications
            </h1>
            <p className="text-gray-600 mt-1">Manage and send notifications to your users</p>
          </div>
        </div>
      </div>

      <div className="px-6 pt-4 border-b border-gray-200 bg-white">
        <div className="flex gap-6">
          {[
            { id: 'dashboard', label: 'Stats & History' },
            { id: 'send', label: 'Send & Schedule' },
            { id: 'template', label: 'Template' },
            { id: 'settings', label: 'Delivery Channel' }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-1 py-3 font-medium text-sm border-b-2 ${activeTab === tab.id ? 'border-green-600 text-green-600' : 'border-transparent text-gray-600'}`}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg border p-6">
                <div className="text-sm text-gray-600 mb-2">Total Notification Sent</div>
                <div className="text-4xl font-bold text-red-600">{stats.totalSent}</div>
              </div>
              <div className="bg-white rounded-lg border p-6">
                <div className="text-sm text-gray-600 mb-2">Delivery Rate</div>
                <div className="text-4xl font-bold text-red-600">{stats.totalSent > 0 ? Math.round((stats.delivered / stats.totalSent) * 100) : 0}%</div>
              </div>
              <div className="bg-white rounded-lg border p-6">
                <div className="text-sm text-gray-600 mb-2">Scheduled</div>
                <div className="text-4xl font-bold text-red-600">{scheduledNotifications.length}</div>
              </div>
            </div>

            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Upcoming Scheduled Notifications</h3>
              <table className="w-full">
                <thead className="bg-purple-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Subject</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Channel</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {scheduledNotifications.length === 0 ? (
                    <tr><td colSpan="4" className="px-4 py-8 text-center text-gray-500 text-sm">No scheduled notifications</td></tr>
                  ) : (
                    scheduledNotifications.map(n => (
                      <tr key={n.id} className="hover:bg-gray-50 border-b">
                        <td className="px-4 py-3 text-sm">{n.scheduleDate} {n.scheduleTime}</td>
                        <td className="px-4 py-3 text-sm">{n.subject}</td>
                        <td className="px-4 py-3 text-sm uppercase">{n.channel}</td>
                        <td className="px-4 py-3 text-sm">
                          <button onClick={() => handleDeleteScheduled(n.id)} className="text-red-600">Cancel</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Notification History</h3>
              <table className="w-full">
                <thead className="bg-purple-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Subject</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Channel</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {notificationHistory.length === 0 ? (
                    <tr><td colSpan="4" className="px-4 py-8 text-center text-gray-500 text-sm">No history yet</td></tr>
                  ) : (
                    notificationHistory.map(n => (
                      <tr key={n.id} className="hover:bg-gray-50 border-b">
                        <td className="px-4 py-3 text-sm">{n.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}</td>
                        <td className="px-4 py-3 text-sm">{n.subject}</td>
                        <td className="px-4 py-3 text-sm uppercase">{n.channel}</td>
                        <td className="px-4 py-3 text-sm"><span className={`px-2 py-1 text-xs rounded ${getStatusColor(n.status)}`}>{n.status}</span></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'send' && (
          <div className="space-y-6">
            <div className="border rounded-lg p-6 bg-white">
              <div className="text-sm font-semibold mb-4">Step 1: Select a Channel</div>
              <div className="space-y-2">
                {[
                  { id: 'email', label: 'Email', configured: emailConfig.is_configured },
                  { id: 'sms', label: 'SMS', configured: smsConfig.is_configured },
                  { id: 'app', label: 'In-App', configured: pushConfig.is_configured }
                ].map(channel => (
                  <label key={channel.id} className="flex items-center gap-3">
                    <input 
                      type="radio" 
                      name="channel" 
                      checked={selectedChannel === channel.id} 
                      onChange={() => setSelectedChannel(channel.id)} 
                      disabled={!channel.configured} 
                      className="w-4 h-4" 
                    />
                    <span className={`text-sm ${!channel.configured ? 'text-gray-400' : ''}`}>
                      {channel.label}{!channel.configured && ' (Not configured)'}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="border-2 border-blue-500 rounded-lg p-6 bg-white">
              <div className="text-sm font-semibold mb-4">Step 2: Select Recipients</div>
              <div className="space-y-2">
                {recipientGroups.map(group => (
                  <label key={group.id} className="flex items-center gap-3">
                    <input 
                      type="checkbox" 
                      checked={selectedRecipients.includes(group.id)} 
                      onChange={(e) => {
                        if (e.target.checked) setSelectedRecipients([...selectedRecipients, group.id]);
                        else setSelectedRecipients(selectedRecipients.filter(id => id !== group.id));
                      }} 
                      className="w-4 h-4 rounded" 
                    />
                    <span className="text-sm flex-1">{group.label}</span>
                    <span className="text-xs text-gray-500">{group.count} users</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="border rounded-lg p-6 bg-white">
              <div className="text-sm font-semibold mb-4">Subject</div>
              <input 
                type="text" 
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter notification subject"
                className="w-full px-4 py-2 border rounded"
              />
            </div>

            <div className="border rounded-lg p-6 bg-white">
              <div className="text-sm font-semibold mb-4">Step 3: Compose your message</div>
              <div className="flex gap-8 mb-4">
                <label className="flex items-center gap-3">
                  <input type="radio" name="messageType" checked={messageType === 'template'} onChange={() => setMessageType('template')} className="w-4 h-4" />
                  <span className="text-sm">Use a template</span>
                </label>
                <label className="flex items-center gap-3">
                  <input type="radio" name="messageType" checked={messageType === 'custom'} onChange={() => setMessageType('custom')} className="w-4 h-4" />
                  <span className="text-sm">Write a custom Message</span>
                </label>
              </div>
              {messageType === 'template' ? (
                <select value={selectedTemplate} onChange={(e) => setSelectedTemplate(e.target.value)} className="w-64 px-3 py-2 text-sm border rounded">
                  <option value="">Select a template</option>
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              ) : (
                <textarea 
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Type your message here..."
                  rows="4"
                  className="w-full px-4 py-2 border rounded"
                />
              )}
            </div>

            <div className="border rounded-lg p-6 bg-white">
              <div className="text-sm font-semibold mb-4">Step 4: Send your message</div>
              <div className="flex gap-8 mb-4">
                <label className="flex items-center gap-3">
                  <input type="radio" name="scheduleType" checked={scheduleType === 'later'} onChange={() => setScheduleType('later')} className="w-4 h-4" />
                  <span className="text-sm">Schedule for later</span>
                </label>
                <label className="flex items-center gap-3">
                  <input type="radio" name="scheduleType" checked={scheduleType === 'now'} onChange={() => setScheduleType('now')} className="w-4 h-4" />
                  <span className="text-sm">Send it now on saving</span>
                </label>
              </div>
              {scheduleType === 'later' && (
                <div className="flex gap-3 items-center">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <input type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} className="px-3 py-2 text-sm border rounded" />
                  <input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} className="px-3 py-2 text-sm border rounded" />
                </div>
              )}
            </div>

            <div className="flex justify-center gap-3">
              <button 
                onClick={handleSendNotification}
                disabled={selectedRecipients.length === 0 || !subject} 
                className="px-8 py-2 bg-green-600 text-white text-sm rounded disabled:opacity-50"
              >
                Save
              </button>
              <button onClick={() => setActiveTab('dashboard')} className="px-8 py-2 bg-gray-400 text-white text-sm rounded">Cancel</button>
            </div>
          </div>
        )}

        {activeTab === 'template' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Templates</h2>
              <button onClick={() => setTemplateModalOpen(true)} className="px-6 py-2 bg-blue-600 text-white rounded flex items-center gap-2">
                <Plus className="w-4 h-4" />Create New Template
              </button>
            </div>
            <div className="bg-white rounded-lg border">
              <table className="w-full">
                <thead className="bg-purple-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {templates.length === 0 ? (
                    <tr><td colSpan="3" className="px-4 py-8 text-center text-gray-500 text-sm">No templates yet</td></tr>
                  ) : (
                    templates.map(t => (
                      <tr key={t.id} className="hover:bg-gray-50 border-b">
                        <td className="px-4 py-3 text-sm font-medium">{t.name}</td>
                        <td className="px-4 py-3 text-sm">{t.category}</td>
                        <td className="px-4 py-3 text-sm">
                          <button className="text-red-600" onClick={async () => {
                            if (window.confirm('Delete this template?')) {
                              await deleteDoc(doc(db, 'notification_templates', t.id));
                              toast.success('Template deleted');
                            }
                          }}>Delete</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Free Tier Services</h3>
              <div className="text-sm text-gray-700 space-y-1">
                <p><strong>Email:</strong> Gmail SMTP (Free) - smtp.gmail.com:587</p>
                <p><strong>SMS:</strong> Twilio Free Trial - $15 credit</p>
                <p><strong>Push:</strong> Firebase (100% Free)</p>
              </div>
            </div>

            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center gap-3 mb-6">
                <Mail className="w-6 h-6 text-blue-600" />
                <h3 className="text-lg font-semibold">Email Configuration (Gmail)</h3>
                <span className={`px-3 py-1 rounded-full text-xs ${emailConfig.is_configured ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                  {emailConfig.is_configured ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div><label className="block text-sm font-medium mb-2">SMTP Host</label><input type="text" value={emailConfig.smtp_host || ''} onChange={(e) => setEmailConfig({...emailConfig, smtp_host: e.target.value})} placeholder="smtp.gmail.com" className="w-full px-4 py-2 border rounded" /></div>
                <div><label className="block text-sm font-medium mb-2">Port</label><input type="text" value={emailConfig.smtp_port || '587'} onChange={(e) => setEmailConfig({...emailConfig, smtp_port: e.target.value})} className="w-full px-4 py-2 border rounded" /></div>
                <div><label className="block text-sm font-medium mb-2">Email</label><input type="text" value={emailConfig.smtp_user || ''} onChange={(e) => setEmailConfig({...emailConfig, smtp_user: e.target.value})} placeholder="your-email@gmail.com" className="w-full px-4 py-2 border rounded" /></div>
                <div><label className="block text-sm font-medium mb-2">Password</label><input type="password" value={emailConfig.smtp_password || ''} onChange={(e) => setEmailConfig({...emailConfig, smtp_password: e.target.value})} placeholder="App password" className="w-full px-4 py-2 border rounded" /></div>
              </div>
              <button onClick={async () => {
                await setDoc(doc(db, 'notification_config', 'email'), {...emailConfig, is_configured: true}, { merge: true });
                toast.success('Email config saved!');
              }} className="px-4 py-2 bg-blue-600 text-white rounded">Save Configuration</button>
            </div>

            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center gap-3 mb-6">
                <MessageSquare className="w-6 h-6 text-green-600" />
                <h3 className="text-lg font-semibold">SMS Configuration (Twilio)</h3>
                <span className={`px-3 py-1 rounded-full text-xs ${smsConfig.is_configured ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                  {smsConfig.is_configured ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div><label className="block text-sm font-medium mb-2">Account SID</label><input type="text" value={smsConfig.api_key || ''} onChange={(e) => setSmsConfig({...smsConfig, api_key: e.target.value})} className="w-full px-4 py-2 border rounded" /></div>
                <div><label className="block text-sm font-medium mb-2">Auth Token</label><input type="password" value={smsConfig.api_secret || ''} onChange={(e) => setSmsConfig({...smsConfig, api_secret: e.target.value})} className="w-full px-4 py-2 border rounded" /></div>
                <div><label className="block text-sm font-medium mb-2">Phone Number</label><input type="text" value={smsConfig.sender_id || ''} onChange={(e) => setSmsConfig({...smsConfig, sender_id: e.target.value})} placeholder="+1234567890" className="w-full px-4 py-2 border rounded" /></div>
              </div>
              <button onClick={async () => {
                await setDoc(doc(db, 'notification_config', 'sms'), {...smsConfig, is_configured: true}, { merge: true });
                toast.success('SMS config saved!');
              }} className="px-4 py-2 bg-green-600 text-white rounded">Save Configuration</button>
            </div>

            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center gap-3 mb-6">
                <Smartphone className="w-6 h-6 text-purple-600" />
                <h3 className="text-lg font-semibold">Push Notification (Firebase)</h3>
                <span className={`px-3 py-1 rounded-full text-xs ${pushConfig.is_configured ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                  {pushConfig.is_configured ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div><label className="block text-sm font-medium mb-2">Server Key</label><input type="password" value={pushConfig.server_key || ''} onChange={(e) => setPushConfig({...pushConfig, server_key: e.target.value})} className="w-full px-4 py-2 border rounded" /></div>
                <div><label className="block text-sm font-medium mb-2">Sender ID</label><input type="text" value={pushConfig.sender_id || ''} onChange={(e) => setPushConfig({...pushConfig, sender_id: e.target.value})} className="w-full px-4 py-2 border rounded" /></div>
              </div>
              <button onClick={async () => {
                await setDoc(doc(db, 'notification_config', 'push'), {...pushConfig, is_configured: true}, { merge: true });
                toast.success('Push config saved!');
              }} className="px-4 py-2 bg-purple-600 text-white rounded">Save Configuration</button>
            </div>
          </div>
        )}
      </div>

      {templateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-lg">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="text-xl font-semibold">Create Template</h2>
              <button onClick={() => setTemplateModalOpen(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div><label className="block text-sm font-medium mb-2">Template Name</label><input type="text" value={templateName} onChange={(e) => setTemplateName(e.target.value)} className="w-full px-4 py-2 border rounded" /></div>
              <div><label className="block text-sm font-medium mb-2">Category</label><select value={templateCategory} onChange={(e) => setTemplateCategory(e.target.value)} className="w-full px-4 py-2 border rounded"><option value="">Select Category</option><option value="Marketing">Marketing</option><option value="Technical">Technical</option><option value="Security">Security</option></select></div>
              <div><label className="block text-sm font-medium mb-2">Content</label><textarea value={templateContent} onChange={(e) => setTemplateContent(e.target.value)} rows="6" className="w-full px-4 py-2 border rounded" /></div>
            </div>
            <div className="px-6 py-4 border-t flex gap-3">
              <button onClick={() => setTemplateModalOpen(false)} className="flex-1 px-4 py-2 border rounded">Cancel</button>
              <button onClick={handleSaveTemplate} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded">Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationSystem;