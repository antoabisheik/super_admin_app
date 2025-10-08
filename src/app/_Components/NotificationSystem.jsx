import React, { useState, useEffect, memo } from 'react';
import { Bell, Send, Calendar, Settings, BarChart3, FileText, Mail, MessageSquare, Smartphone, Clock, Check, X, Plus, Search, Edit2, Trash2, Copy, AlertCircle, Zap } from 'lucide-react';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, onSnapshot, serverTimestamp, query, orderBy, setDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
const TemplateModalComponent = memo(({
  isOpen,
  onClose,
  editingTemplate,
  templateName,
  onTemplateNameChange,
  templateCategory,
  onTemplateCategoryChange,
  templateContent,
  onTemplateContentChange,
  onSave
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold">{editingTemplate ? 'Edit Template' : 'Create Template'}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Template Name</label>
            <input
              type="text"
              value={templateName}
              onChange={onTemplateNameChange}
              placeholder="e.g., Welcome Email"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={templateCategory}
              onChange={onTemplateCategoryChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Category</option>
              <option value="Marketing">Marketing</option>
              <option value="Technical">Technical</option>
              <option value="Security">Security</option>
              <option value="Product">Product</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Template Content</label>
            <textarea
              value={templateContent}
              onChange={onTemplateContentChange}
              placeholder="Write your template content here..."
              rows="6"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {editingTemplate ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
});

const NotificationSystem = ({ db }) => {
  console.log('🚀 NotificationSystem component mounted with db:', db ? 'Connected' : 'Not Connected');

  const [activeTab, setActiveTab] = useState('dashboard');
  const [quickSendOpen, setQuickSendOpen] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState('email');
  const [selectedRecipients, setSelectedRecipients] = useState([]);
  const [messageType, setMessageType] = useState('template');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [scheduleType, setScheduleType] = useState('now');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [customMessage, setCustomMessage] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [subject, setSubject] = useState('');

  const [templates, setTemplates] = useState([]);
  const [scheduledNotifications, setScheduledNotifications] = useState([]);
  const [notificationHistory, setNotificationHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [templateName, setTemplateName] = useState('');
  const [templateCategory, setTemplateCategory] = useState('');
  const [templateContent, setTemplateContent] = useState('');

  const handleTemplateNameChange = (e) => {
    setTemplateName(e.target.value);
  };

  const handleTemplateCategoryChange = (e) => {
    setTemplateCategory(e.target.value);
  };

  const handleTemplateContentChange = (e) => {
    setTemplateContent(e.target.value);
  };

  const [emailConfig, setEmailConfig] = useState({
    provider: 'smtp',
    smtp_host: '',
    smtp_port: '587',
    smtp_user: '',
    smtp_password: '',
    from_email: '',
    from_name: '',
    use_tls: true,
    is_configured: false
  });

  const [smsConfig, setSmsConfig] = useState({
    provider: 'twilio',
    api_key: '',
    api_secret: '',
    sender_id: '',
    is_configured: false
  });

  const [pushConfig, setPushConfig] = useState({
    provider: 'fcm',
    server_key: '',
    sender_id: '',
    is_configured: false
  });

  useEffect(() => {
    if (!db) return;

    const loadData = async () => {
      try {
        setIsLoading(true);

        const templatesUnsubscribe = onSnapshot(
          collection(db, 'notification_templates'),
          (snapshot) => {
            const templatesData = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            setTemplates(templatesData);
          }
        );



        const scheduledUnsubscribe = onSnapshot(
          query(collection(db, 'scheduled_notifications'), orderBy('scheduleDate', 'asc')),
          (snapshot) => {
            const scheduledData = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            setScheduledNotifications(scheduledData);
          }
        );

        const historyUnsubscribe = onSnapshot(
          query(collection(db, 'notification_history'), orderBy('createdAt', 'desc')),
          (snapshot) => {
            const historyData = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            setNotificationHistory(historyData);
          }
        );

        const configSnapshot = await getDocs(collection(db, 'notification_config'));
        configSnapshot.forEach((doc) => {
          const data = doc.data();
          if (doc.id === 'email') setEmailConfig(data);
          if (doc.id === 'sms') setSmsConfig(data);
          if (doc.id === 'push') setPushConfig(data);
        });

        setIsLoading(false);

        return () => {
          templatesUnsubscribe();
          scheduledUnsubscribe();
          historyUnsubscribe();
        };
      } catch (error) {
        console.error('Error loading data:', error);
        setIsLoading(false);
      }
    };

    loadData();
  }, [db]);

  const [recipientGroups, setRecipientGroups] = useState([]);
  const [isCounting, setIsCounting] = useState(true);

  useEffect(() => {
    if (!db) return;

    const fetchRecipientCounts = async () => {
      setIsCounting(true);
      try {
        const orgsRef = collection(db, "organizations");
        const orgsSnap = await getDocs(orgsRef);

        let totalAdmins = 0;
        let totalCoaches = 0;
        let totalStudents = 0;

        // Loop through each organization
        for (const orgDoc of orgsSnap.docs) {
          const gymsRef = collection(db, `organizations/${orgDoc.id}/gyms`);
          const gymsSnap = await getDocs(gymsRef);

          for (const gymDoc of gymsSnap.docs) {
            const gymData = gymDoc.data();

            // ✅ Count admins (manager field)
            if (gymData.manager) totalAdmins++;

            // ✅ Count head coaches
            const headCoachesRef = collection(db, `organizations/${orgDoc.id}/gyms/${gymDoc.id}/headCoaches`);
            const headCoachesSnap = await getDocs(headCoachesRef);
            totalCoaches += headCoachesSnap.size;

            // ✅ Count all users (students)
            const allUsersRef = collection(db, `organizations/${orgDoc.id}/gyms/${gymDoc.id}/allUsers`);
            const allUsersSnap = await getDocs(allUsersRef);
            totalStudents += allUsersSnap.size;
          }
        }

        const totalAll = totalAdmins + totalCoaches + totalStudents;

        setRecipientGroups([
          { id: 'all', label: 'All Users', count: totalAll },
          { id: 'admin', label: 'Academy Admins', count: totalAdmins },
          { id: 'coach', label: 'Head Coaches', count: totalCoaches },
          { id: 'students', label: 'Active Students', count: totalStudents },
        ]);
      } catch (error) {
        console.error("Error fetching recipient counts:", error);
      } finally {
        setIsCounting(false);
      }
    };

    fetchRecipientCounts();
  }, [db]);


  const stats = {
    totalSent: notificationHistory.length,
    delivered: notificationHistory.filter(n => n.status === 'Delivered').length,
    scheduled: scheduledNotifications.length,
    templates: templates.length
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Delivered': return 'bg-green-100 text-green-700';
      case 'Pending': return 'bg-yellow-100 text-yellow-700';
      case 'Failed': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const handleSendNotification = async () => {
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
        toast.success('Notification scheduled successfully!');
      } else {
        await addDoc(collection(db, 'notification_history'), {
          ...payload,
          status: 'Delivered',
          sentAt: serverTimestamp()
        });
        toast.success('Notification sent successfully!');
      }

      setQuickSendOpen(false);
      setSelectedRecipients([]);
      setCustomMessage('');
      setSubject('');
      setScheduleDate('');
      setScheduleTime('');
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error('Failed to send notification');
    }
  };

  const handleDeleteScheduled = async (id) => {
    if (window.confirm('Delete this scheduled notification?')) {
      try {
        await deleteDoc(doc(db, 'scheduled_notifications', id));
        toast.success('Scheduled notification deleted');
      } catch (error) {
        console.error('Error deleting scheduled notification:', error);
        toast.error('Failed to delete notification');
      }
    }
  };

  const handleSaveTemplate = async () => {
    try {
      const templateData = {
        name: templateName,
        category: templateCategory,
        content: templateContent,
        updatedAt: serverTimestamp()
      };

      if (editingTemplate) {
        await updateDoc(doc(db, 'notification_templates', editingTemplate.id), templateData);
        toast.success('Template updated successfully!');
      } else {
        await addDoc(collection(db, 'notification_templates'), {
          ...templateData,
          createdAt: serverTimestamp()
        });
        toast.success('Template created successfully!');
      }

      setTemplateModalOpen(false);
      setTemplateName('');
      setTemplateCategory('');
      setTemplateContent('');
      setEditingTemplate(null);
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save template');
    }
  };

  const handleDeleteTemplate = async (id) => {
    if (window.confirm('Delete this template?')) {
      try {
        await deleteDoc(doc(db, 'notification_templates', id));
        toast.success('Template deleted');
      } catch (error) {
        console.error('Error deleting template:', error);
        toast.error('Failed to delete template');
      }
    }
  };

  const handleEditTemplate = (template) => {
    setEditingTemplate(template);
    setTemplateName(template.name);
    setTemplateCategory(template.category);
    setTemplateContent(template.content);
    setTemplateModalOpen(true);
  };

  const saveConfig = async (configType, configData) => {
    try {
      const docRef = doc(db, 'notification_config', configType);
      await setDoc(docRef, configData, { merge: true });
      toast.success('Configuration saved successfully!');
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error('Failed to save configuration');
    }
  };

  const closeTemplateModal = () => {
    setTemplateModalOpen(false);
    setEditingTemplate(null);
    setTemplateName('');
    setTemplateCategory('');
    setTemplateContent('');
  };
  // Right after pushConfig state (around line 170)
  console.log('🔍 Validation Results:');
  console.log('Email configured?', emailConfig?.is_configured === true && emailConfig?.smtp_host && emailConfig?.smtp_user && emailConfig?.smtp_password);
  console.log('SMS configured?', smsConfig?.is_configured === true);
  console.log('Push configured?', pushConfig?.is_configured === true);
  console.log('=== CONFIG STATUS ===');
  console.log('📧 emailConfig:', emailConfig);
  console.log('📱 smsConfig:', smsConfig);
  console.log('🔔 pushConfig:', pushConfig);
  console.log('====================');

  const QuickSendPanel = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-purple-50">
          <h2 className="text-xl font-semibold text-gray-800">Quick Send Notification</h2>
          <button onClick={() => setQuickSendOpen(false)} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Channel</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'email', icon: Mail, label: 'Email', configured: emailConfig.is_configured },
                { id: 'sms', icon: MessageSquare, label: 'SMS', configured: smsConfig.is_configured },
                { id: 'app', icon: Smartphone, label: 'In-App', configured: pushConfig.is_configured }
              ].map(channel => (
                <button
                  key={channel.id}
                  onClick={() => setSelectedChannel(channel.id)}
                  disabled={!channel.configured}
                  className={`p-4 rounded-lg border-2 transition-all relative ${selectedChannel === channel.id
                    ? 'border-blue-500 bg-blue-50'
                    : channel.configured
                      ? 'border-gray-200 hover:border-gray-300'
                      : 'border-gray-200 opacity-50 cursor-not-allowed'
                    }`}
                >
                  {!channel.configured && (
                    <div className="absolute top-2 right-2">
                      <AlertCircle className="w-4 h-4 text-orange-500" />
                    </div>
                  )}
                  <channel.icon className={`w-6 h-6 mx-auto mb-2 ${selectedChannel === channel.id ? 'text-blue-600' : 'text-gray-600'
                    }`} />
                  <div className="text-sm font-medium text-gray-700">{channel.label}</div>
                  {!channel.configured && (
                    <div className="text-xs text-orange-600 mt-1">Not configured</div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Recipients</label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {recipientGroups.map(group => (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {isCounting ? (
                    <p className="text-sm text-gray-500 text-center py-3">Loading recipient data...</p>
                  ) : recipientGroups.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-3">No recipient data found</p>
                  ) : (
                    recipientGroups.map(group => (
                      <label key={group.id} className="flex items-center p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedRecipients.includes(group.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedRecipients([...selectedRecipients, group.id]);
                            } else {
                              setSelectedRecipients(selectedRecipients.filter(id => id !== group.id));
                            }
                          }}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <span className="ml-3 flex-1 text-sm text-gray-700">{group.label}</span>
                        <span className="text-xs text-gray-500">{group.count} users</span>
                      </label>
                    ))
                  )}
                </div>

              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Notification subject"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Message</label>
            <div className="flex gap-3 mb-4">
              <button
                onClick={() => setMessageType('template')}
                className={`flex-1 py-2 px-4 rounded-lg border-2 transition-all ${messageType === 'template'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
              >
                Use Template
              </button>
              <button
                onClick={() => setMessageType('custom')}
                className={`flex-1 py-2 px-4 rounded-lg border-2 transition-all ${messageType === 'custom'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
              >
                Custom Message
              </button>
            </div>

            {messageType === 'template' ? (
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a template</option>
                {templates.map(template => (
                  <option key={template.id} value={template.id}>
                    {template.name} - {template.category}
                  </option>
                ))}
              </select>
            ) : (
              <textarea
                placeholder="Type your message here..."
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows="4"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Send Time</label>
            <div className="flex gap-3">
              <button
                onClick={() => setScheduleType('now')}
                className={`flex-1 py-2 px-4 rounded-lg border-2 transition-all ${scheduleType === 'now'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
              >
                Send Now
              </button>
              <button
                onClick={() => setScheduleType('later')}
                className={`flex-1 py-2 px-4 rounded-lg border-2 transition-all ${scheduleType === 'later'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
              >
                Schedule
              </button>
            </div>

            {scheduleType === 'later' && (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <input
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex gap-3 bg-gray-50">
          <button
            onClick={() => setQuickSendOpen(false)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSendNotification}
            disabled={selectedRecipients.length === 0 || !subject}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            {scheduleType === 'now' ? 'Send Now' : 'Schedule'}
          </button>
        </div>
      </div>
    </div>
  );

  const Dashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <Send className="w-8 h-8 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.totalSent}</div>
          <div className="text-sm text-gray-600 mt-1">Total Sent</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.delivered}</div>
          <div className="text-sm text-gray-600 mt-1">Delivered</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-8 h-8 text-orange-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.scheduled}</div>
          <div className="text-sm text-gray-600 mt-1">Scheduled</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <FileText className="w-8 h-8 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.templates}</div>
          <div className="text-sm text-gray-600 mt-1">Templates</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Scheduled Notifications</h3>
            <Calendar className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {scheduledNotifications.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No scheduled notifications</p>
            ) : (
              scheduledNotifications.map(notification => (
                <div key={notification.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{notification.subject}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      {notification.recipients?.join(', ')} • {notification.channel}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">{notification.scheduleDate}</div>
                      <div className="text-xs text-gray-500">{notification.scheduleTime}</div>
                    </div>
                    <button
                      onClick={() => handleDeleteScheduled(notification.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Templates</h3>
            <button
              onClick={() => setTemplateModalOpen(true)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              New
            </button>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {templates.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No templates yet</p>
            ) : (
              templates.map(template => (
                <div key={template.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{template.name}</div>
                    <div className="text-xs text-gray-500 mt-1">{template.category}</div>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEditTemplate(template)}
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      <Edit2 className="w-4 h-4 text-gray-600" />
                    </button>
                    <button
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const History = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="delivered">Delivered</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto max-h-96">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Channel</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {notificationHistory.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                  No notification history yet
                </td>
              </tr>
            ) : (
              notificationHistory
                .filter(n => filterStatus === 'all' || n.status?.toLowerCase() === filterStatus)
                .filter(n => !searchQuery || n.subject?.toLowerCase().includes(searchQuery.toLowerCase()))
                .map(notification => (
                  <tr key={notification.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {notification.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{notification.subject}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{notification.channel}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(notification.status)}`}>
                        {notification.status}
                      </span>
                    </td>
                  </tr>
                ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const SettingsPanel = () => (
    <div className="space-y-6 max-h-[calc(100vh-250px)] overflow-y-auto">
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200 p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-blue-600 mt-1" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Free Tier Configuration</h3>
            <div className="text-sm text-gray-700 space-y-2">
              <p><strong>Email:</strong> Use Gmail SMTP (Free) - smtp.gmail.com:587</p>
              <p className="text-xs text-gray-600">Enable "Less secure app access" or use App Password in your Google Account</p>

              <p className="mt-3"><strong>SMS:</strong> Use Twilio Free Trial - Get $15 credit</p>
              <p className="text-xs text-gray-600">Sign up at twilio.com for free trial credits</p>

              <p className="mt-3"><strong>Push:</strong> Use Firebase Cloud Messaging (Free)</p>
              <p className="text-xs text-gray-600">Completely free with unlimited notifications on firebase.google.com</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Mail className="w-6 h-6 text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Email Configuration (Gmail SMTP - Free)</h3>
              <p className="text-sm text-gray-600">Use your Gmail account for free email sending</p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${emailConfig.is_configured ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
            }`}>
            {emailConfig.is_configured ? 'Active' : 'Inactive'}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Host</label>
            <input
              type="text"
              value={emailConfig.smtp_host}
              onChange={(e) => setEmailConfig({ ...emailConfig, smtp_host: e.target.value })}
              placeholder="smtp.gmail.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Port</label>
            <input
              type="text"
              value={emailConfig.smtp_port}
              onChange={(e) => setEmailConfig({ ...emailConfig, smtp_port: e.target.value })}
              placeholder="587"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Gmail Address</label>
            <input
              type="text"
              value={emailConfig.smtp_user}
              onChange={(e) => setEmailConfig({ ...emailConfig, smtp_user: e.target.value })}
              placeholder="your-email@gmail.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">App Password</label>
            <input
              type="password"
              value={emailConfig.smtp_password}
              onChange={(e) => setEmailConfig({ ...emailConfig, smtp_password: e.target.value })}
              placeholder="16-character app password"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">From Email</label>
            <input
              type="email"
              value={emailConfig.from_email}
              onChange={(e) => setEmailConfig({ ...emailConfig, from_email: e.target.value })}
              placeholder="noreply@yourapp.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">From Name</label>
            <input
              type="text"
              value={emailConfig.from_name}
              onChange={(e) => setEmailConfig({ ...emailConfig, from_name: e.target.value })}
              placeholder="Your App Name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={() => saveConfig('email', { ...emailConfig, is_configured: true })}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Save Configuration
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-6 h-6 text-green-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">SMS Configuration (Twilio Free Trial)</h3>
              <p className="text-sm text-gray-600">Get $15 free credit on Twilio</p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${smsConfig.is_configured ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
            }`}>
            {smsConfig.is_configured ? 'Active' : 'Inactive'}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Provider</label>
            <select
              value={smsConfig.provider}
              onChange={(e) => setSmsConfig({ ...smsConfig, provider: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="twilio">Twilio (Free Trial)</option>
              <option value="msg91">MSG91 (Free Trial)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Account SID / API Key</label>
            <input
              type="text"
              value={smsConfig.api_key}
              onChange={(e) => setSmsConfig({ ...smsConfig, api_key: e.target.value })}
              placeholder="Your Account SID"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Auth Token / API Secret</label>
            <input
              type="password"
              value={smsConfig.api_secret}
              onChange={(e) => setSmsConfig({ ...smsConfig, api_secret: e.target.value })}
              placeholder="Your Auth Token"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
            <input
              type="text"
              value={smsConfig.sender_id}
              onChange={(e) => setSmsConfig({ ...smsConfig, sender_id: e.target.value })}
              placeholder="+1234567890"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={() => saveConfig('sms', { ...smsConfig, is_configured: true })}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Save Configuration
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Smartphone className="w-6 h-6 text-purple-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Push Notification (Firebase - Free Forever)</h3>
              <p className="text-sm text-gray-600">100% free with unlimited notifications</p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${pushConfig.is_configured ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
            }`}>
            {pushConfig.is_configured ? 'Active' : 'Inactive'}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Provider</label>
            <select
              value={pushConfig.provider}
              onChange={(e) => setPushConfig({ ...pushConfig, provider: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="fcm">Firebase (FCM - Free)</option>
              <option value="onesignal">OneSignal (Free Tier)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Server Key</label>
            <input
              type="password"
              value={pushConfig.server_key}
              onChange={(e) => setPushConfig({ ...pushConfig, server_key: e.target.value })}
              placeholder="Your FCM Server Key"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sender ID / Project ID</label>
            <input
              type="text"
              value={pushConfig.sender_id}
              onChange={(e) => setPushConfig({ ...pushConfig, sender_id: e.target.value })}
              placeholder="Your FCM Sender ID"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={() => saveConfig('push', { ...pushConfig, is_configured: true })}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <div className="p-6 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Bell className="w-8 h-8 text-blue-600" />
              Notifications
            </h1>
            <p className="text-gray-600 mt-1">Manage and send notifications to your users</p>
          </div>
          <button
            onClick={() => setQuickSendOpen(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-lg shadow-blue-600/30"
          >
            <Plus className="w-5 h-5" />
            Quick Send
          </button>
        </div>
      </div>

      <div className="px-6 pt-4 border-b border-gray-200 bg-white">
        <div className="flex gap-2">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
            { id: 'history', label: 'History', icon: Clock },
            { id: 'settings', label: 'Settings', icon: Settings }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 font-medium transition-colors flex items-center gap-2 border-b-2 ${activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'history' && <History />}
        {activeTab === 'settings' && <SettingsPanel />}
      </div>

      {quickSendOpen && <QuickSendPanel />}
      <TemplateModalComponent
        isOpen={templateModalOpen}
        onClose={closeTemplateModal}
        editingTemplate={editingTemplate}
        templateName={templateName}
        onTemplateNameChange={handleTemplateNameChange}
        templateCategory={templateCategory}
        onTemplateCategoryChange={handleTemplateCategoryChange}
        templateContent={templateContent}
        onTemplateContentChange={handleTemplateContentChange}
        onSave={handleSaveTemplate}
      />
    </div>
  );
};

export default NotificationSystem;