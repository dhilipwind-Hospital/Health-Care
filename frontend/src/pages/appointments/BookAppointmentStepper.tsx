import React, { useEffect, useState, useMemo } from 'react';
import { Input, Select, message, Spin, Modal, Result, Button, Calendar } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import dayjs, { Dayjs } from 'dayjs';
import {
  CalendarOutlined,
  CheckCircleOutlined,
  UserOutlined,
  SearchOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';
import api from '../../services/api';
import './BookAppointmentStepper.css';

const { TextArea } = Input;

interface Service {
  id: string;
  name: string;
  description?: string;
  duration?: number;
  department?: { id: string; name: string };
}

interface Department {
  id: string;
  name: string;
}

interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
  specialization?: string;
  department?: { id: string; name: string };
  consultationFee?: number;
  experience?: number;
  rating?: number;
  availableDays?: string[];
}

const BookAppointmentStepper: React.FC = () => {
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const { user } = useAuth();

  // Data states
  const [services, setServices] = useState<Service[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Selection states
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<string>('name');

  // Real availability data: doctorId -> available time slot strings (e.g. "9:00", "9:30")
  const [doctorAvailability, setDoctorAvailability] = useState<Record<string, string[]>>({});
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityDate, setAvailabilityDate] = useState<string | null>(null);

  // Success modal
  const [showSuccess, setShowSuccess] = useState(false);
  const [bookingDetails, setBookingDetails] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  // Fetch real availability when date changes
  useEffect(() => {
    if (!selectedDate) return;
    const dateStr = selectedDate.format('YYYY-MM-DD');
    if (dateStr === availabilityDate) return; // already fetched for this date

    const fetchAvailability = async () => {
      setAvailabilityLoading(true);
      try {
        const res = await api.get('/availability/slots/available', {
          params: { date: dateStr },
          suppressErrorToast: true,
        } as any);
        const slots = res.data?.data || [];
        const avMap: Record<string, string[]> = {};
        for (const entry of slots) {
          const docId = entry.doctor?.id;
          if (!docId) continue;
          const times = (entry.availableTimeSlots || []).map((ts: any) => {
            const d = new Date(ts.startTime);
            return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
          });
          avMap[docId] = [...(avMap[docId] || []), ...times];
        }
        setDoctorAvailability(avMap);
        setAvailabilityDate(dateStr);
      } catch {
        // If availability API fails, clear data so all show as available (graceful fallback)
        setDoctorAvailability({});
        setAvailabilityDate(dateStr);
      }
      setAvailabilityLoading(false);
    };
    fetchAvailability();
  }, [selectedDate, availabilityDate]);

  const loadData = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token || !user) {
        messageApi.error('Please login first');
        navigate('/login');
        return;
      }

      const userOrg = (user as any)?.organization;
      const orgId = userOrg?.id;

      if (!orgId || orgId === 'default') {
        messageApi.warning('Please select your organization first');
        return;
      }

      // Test auth first
      try {
        await api.get('/auth/me');
      } catch {
        messageApi.error('Authentication failed. Please login again.');
        navigate('/login');
        return;
      }

      const [svcRes, deptRes, docRes] = await Promise.all([
        api.get('/services', { params: { page: 1, limit: 200 }, suppressErrorToast: true } as any).catch(() => ({ data: { data: [] } })),
        api.get('/departments', { params: { page: 1, limit: 200 }, suppressErrorToast: true } as any).catch(() => ({ data: { data: [] } })),
        api.get('/visits/available-doctors', { suppressErrorToast: true } as any).catch(() => ({ data: { data: [] } })),
      ]);

      const svc = svcRes.data?.data || svcRes.data || [];
      const dept = deptRes.data?.data || deptRes.data || [];
      let doc = docRes.data?.data || docRes.data || [];

      // If available-doctors endpoint returned empty, fallback to all doctors
      if (doc.length === 0) {
        try {
          const fallbackRes = await api.get('/users', { params: { role: 'doctor', limit: 200 }, suppressErrorToast: true } as any);
          doc = fallbackRes.data?.data || fallbackRes.data || [];
        } catch { /* ignore */ }
      }

      setServices(svc);
      setDepartments(dept);
      setDoctors(doc);

      if (svc.length === 0 && dept.length > 0) {
        messageApi.info('No services found. You can still book by selecting a doctor directly.');
      } else if (svc.length === 0 && dept.length === 0) {
        messageApi.warning('No services or departments configured. Please contact your administrator.');
      }
    } catch (error: any) {
      console.error('Error loading data:', error);
      messageApi.error('Failed to load appointment data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filtered doctors
  const filteredDoctors = useMemo(() => {
    let result = [...doctors];

    // Department filter
    if (selectedDepartment !== 'all') {
      result = result.filter(
        (d) => d.department?.id === selectedDepartment || d.department?.name === selectedDepartment
      );
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (d) =>
          `${d.firstName} ${d.lastName}`.toLowerCase().includes(q) ||
          (d.specialization || '').toLowerCase().includes(q) ||
          (d.department?.name || '').toLowerCase().includes(q)
      );
    }

    // Sort
    if (sortBy === 'name') {
      result.sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`));
    } else if (sortBy === 'experience') {
      result.sort((a, b) => (b.experience || 0) - (a.experience || 0));
    } else if (sortBy === 'fee') {
      result.sort((a, b) => (a.consultationFee || 0) - (b.consultationFee || 0));
    }

    return result;
  }, [doctors, selectedDepartment, searchQuery, sortBy]);

  // Unique departments from doctors
  const uniqueDepartments = useMemo(() => {
    const deptMap = new Map<string, string>();
    doctors.forEach((d) => {
      if (d.department?.id && d.department?.name) {
        deptMap.set(d.department.id, d.department.name);
      }
    });
    // Also include departments from the departments API
    departments.forEach((d) => {
      if (d.id && d.name) {
        deptMap.set(d.id, d.name);
      }
    });
    return Array.from(deptMap.entries()).map(([id, name]) => ({ id, name }));
  }, [doctors, departments]);

  // Generate time slots — use real availability when available
  const generateTimeSlots = useMemo(() => {
    const morning: { label: string; value: string; available: boolean }[] = [];
    const afternoon: { label: string; value: string; available: boolean }[] = [];
    const evening: { label: string; value: string; available: boolean }[] = [];

    // Check if we have real availability data for the selected doctor
    const hasRealData = selectedDoctor && availabilityDate && Object.keys(doctorAvailability).length > 0;
    const doctorSlots = selectedDoctor ? doctorAvailability[selectedDoctor.id] : undefined;

    const isSlotAvailable = (hourVal: string) => {
      if (!hasRealData) return true; // No availability data → show all as available (fallback)
      if (!doctorSlots) return false; // Doctor has no availability slots for this date
      return doctorSlots.includes(hourVal);
    };

    // Morning: 9 AM - 12 PM
    for (let hour = 9; hour < 12; hour++) {
      for (const min of [0, 30]) {
        const h12 = hour > 12 ? hour - 12 : hour;
        const label = `${String(h12).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
        const value = `${hour}:${String(min).padStart(2, '0')}`;
        morning.push({ label, value, available: isSlotAvailable(value) });
      }
    }

    // Afternoon: 12 PM - 5 PM
    for (let hour = 12; hour < 17; hour++) {
      for (const min of [0, 30]) {
        const h12 = hour > 12 ? hour - 12 : hour;
        const label = `${String(h12).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
        const value = `${hour}:${String(min).padStart(2, '0')}`;
        afternoon.push({ label, value, available: isSlotAvailable(value) });
      }
    }

    // Evening: 5 PM - 8 PM
    for (let hour = 17; hour < 20; hour++) {
      for (const min of [0, 30]) {
        const h12 = hour - 12;
        const label = `${String(h12).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
        const value = `${hour}:${String(min).padStart(2, '0')}`;
        evening.push({ label, value, available: isSlotAvailable(value) });
      }
    }

    return { morning, afternoon, evening };
  }, [selectedDoctor, doctorAvailability, availabilityDate]);

  // Current step computation
  const currentStep = useMemo(() => {
    if (!selectedDoctor) return 0;
    if (!selectedDate || !selectedTime) return 1;
    return 2;
  }, [selectedDoctor, selectedDate, selectedTime]);

  // Find matching service for doctor's department
  const matchingService = useMemo(() => {
    if (!selectedDoctor) return null;
    // Find a service in the doctor's department
    const deptService = services.find(
      (s) => s.department?.id === selectedDoctor.department?.id
    );
    if (deptService) return deptService;
    // If no department-matching service, try finding a "General Consultation" service
    const generalService = services.find(
      (s) => s.name?.toLowerCase().includes('general') || s.name?.toLowerCase().includes('consultation')
    );
    // Only use a non-department service if the doctor has no department set (avoids backend 400 error)
    if (!selectedDoctor.department?.id) {
      return generalService || services[0] || null;
    }
    // Doctor has a department but no matching service — return null (will show error)
    return generalService || null;
  }, [selectedDoctor, services]);

  const handleSubmit = async () => {
    if (!selectedDoctor || !selectedDate || !selectedTime) {
      messageApi.error('Please select a doctor, date, and time');
      return;
    }

    const service = matchingService;
    if (!service || !service.id) {
      console.error('No matching service found for doctor:', selectedDoctor);
      console.error('Available services:', services);
      messageApi.error('No service available for this doctor. Please try another doctor or contact support.');
      return;
    }

    // Validate UUIDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(service.id)) {
      console.error('Invalid service ID format:', service.id);
      messageApi.error('Invalid service ID. Please refresh and try again.');
      return;
    }
    if (!uuidRegex.test(selectedDoctor.id)) {
      console.error('Invalid doctor ID format:', selectedDoctor.id);
      messageApi.error('Invalid doctor ID. Please refresh and try again.');
      return;
    }

    try {
      setSubmitting(true);
      const [hourStr, minuteStr] = selectedTime.split(':');
      const hour = parseInt(hourStr);
      const minute = parseInt(minuteStr);
      const startTime = selectedDate.hour(hour).minute(minute).second(0);
      const endTime = startTime.add(service.duration || 30, 'minute');

      const payload = {
        serviceId: service.id,
        doctorId: selectedDoctor.id,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        reason: notes || 'General consultation',
        notes: notes,
        preferences: {
          urgency: 'routine',
        },
      };

      console.log('=== BOOKING PAYLOAD ===');
      console.log('Service ID:', payload.serviceId);
      console.log('Doctor ID:', payload.doctorId);
      console.log('Start Time:', payload.startTime);
      console.log('End Time:', payload.endTime);
      console.log('Full Payload:', JSON.stringify(payload, null, 2));

      const response = await api.post('/appointments', payload);

      console.log('Booking response:', response.data);

      setBookingDetails({
        doctor: `Dr. ${selectedDoctor.firstName} ${selectedDoctor.lastName}`,
        department: selectedDoctor.department?.name || selectedDoctor.specialization || '-',
        date: selectedDate.format('DD MMM YYYY'),
        time: selectedTime,
        fee: selectedDoctor.consultationFee,
        confirmationId: response.data?.id || 'N/A',
      });
      setShowSuccess(true);
    } catch (error: any) {
      console.error('=== BOOKING ERROR ===');
      console.error('Error response:', error?.response?.data);
      console.error('Error status:', error?.response?.status);
      console.error('Full error:', error);
      const errorMsg = error?.response?.data?.message || error?.response?.data?.error || 'Failed to book appointment';
      messageApi.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const disabledDate = (d: Dayjs) => {
    return d && d < dayjs().startOf('day');
  };

  const canConfirm = selectedDoctor && selectedDate && selectedTime;

  return (
    <div className="book-appointment-page">
      {contextHolder}

      {/* Loading Overlay */}
      {submitting && (
        <div className="booking-loading-overlay">
          <Spin size="large" />
          <p>Booking your appointment...</p>
        </div>
      )}

      {/* Success Modal */}
      <Modal
        open={showSuccess}
        footer={null}
        closable={false}
        centered
        className="booking-success-modal"
        width={480}
      >
        <Result
          status="success"
          title="Appointment Booked Successfully!"
          subTitle={
            <div style={{ textAlign: 'left', maxWidth: 320, margin: '0 auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: '#6b7a8d' }}>Doctor</span>
                <span style={{ fontWeight: 600 }}>{bookingDetails?.doctor}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: '#6b7a8d' }}>Department</span>
                <span style={{ fontWeight: 600 }}>{bookingDetails?.department}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: '#6b7a8d' }}>Date</span>
                <span style={{ fontWeight: 600 }}>{bookingDetails?.date}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: '#6b7a8d' }}>Time</span>
                <span style={{ fontWeight: 600 }}>{bookingDetails?.time}</span>
              </div>
              {bookingDetails?.fee && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7a8d' }}>Fee</span>
                  <span style={{ fontWeight: 700, color: '#0d9488' }}>₹{bookingDetails.fee}</span>
                </div>
              )}
            </div>
          }
          extra={[
            <Button
              type="primary"
              key="view"
              style={{ background: '#0d9488', borderColor: '#0d9488' }}
              onClick={() => {
                setShowSuccess(false);
                const role = String((user as any)?.role || '').toLowerCase();
                navigate(role === 'patient' ? '/portal' : '/appointments');
              }}
            >
              View My Appointments
            </Button>,
            <Button key="home" onClick={() => {
              setShowSuccess(false);
              const role = String((user as any)?.role || '').toLowerCase();
              navigate(role === 'patient' ? '/portal' : '/dashboard');
            }}>
              Go to Dashboard
            </Button>,
          ]}
        />
      </Modal>

      {/* Page Header */}
      <div className="book-appointment-header">
        <div>
          <h1>Book an Appointment</h1>
          <p>Find and book your preferred doctor in a few simple steps</p>
        </div>
        <div className="header-actions">
          {(user as any)?.organization?.name && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                borderRadius: 8,
                background: '#f0fdfa',
                color: '#0d9488',
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              <EnvironmentOutlined />
              {(user as any).organization.name}
            </div>
          )}
          <Input
            prefix={<SearchOutlined style={{ color: '#8899a6' }} />}
            placeholder="Search doctors, specialties..."
            style={{ width: 240, borderRadius: 8 }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            allowClear
          />
        </div>
      </div>

      {/* Progress Steps */}
      <div className="booking-steps">
        <div className="step-item">
          <div className={`step-circle ${currentStep >= 0 ? 'active' : ''} ${currentStep > 0 ? 'completed' : ''}`}>
            {currentStep > 0 ? <CheckCircleOutlined /> : <UserOutlined />}
          </div>
          <div className="step-info">
            <span className={`step-title ${currentStep >= 0 ? 'active' : ''}`}>Select Doctor</span>
            <span className="step-subtitle">Choose specialty & doctor</span>
          </div>
        </div>

        <div className={`step-connector ${currentStep > 0 ? 'completed' : ''}`} />

        <div className="step-item">
          <div className={`step-circle ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
            {currentStep > 1 ? <CheckCircleOutlined /> : <>2</>}
          </div>
          <div className="step-info">
            <span className={`step-title ${currentStep >= 1 ? 'active' : ''}`}>Date & Time</span>
            <span className="step-subtitle">Pick your time slot</span>
          </div>
        </div>

        <div className={`step-connector ${currentStep > 1 ? 'completed' : ''}`} />

        <div className="step-item">
          <div className={`step-circle ${currentStep >= 2 ? 'active' : ''}`}>
            {currentStep >= 2 ? <CheckCircleOutlined /> : <>3</>}
          </div>
          <div className="step-info">
            <span className={`step-title ${currentStep >= 2 ? 'active' : ''}`}>Confirm</span>
            <span className="step-subtitle">Review & book</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 80 }}>
          <Spin size="large" />
          <p style={{ marginTop: 16, color: '#6b7a8d' }}>Loading doctors...</p>
        </div>
      ) : (
        <div className="booking-layout">
          {/* LEFT: Doctor Selection */}
          <div>
            {/* Department Filter Pills */}
            <div className="department-filter">
              <span className="department-filter-label">Department:</span>
              <button
                className={`dept-pill ${selectedDepartment === 'all' ? 'active' : ''}`}
                onClick={() => setSelectedDepartment('all')}
              >
                All
              </button>
              {uniqueDepartments.map((dept) => (
                <button
                  key={dept.id}
                  className={`dept-pill ${selectedDepartment === dept.id ? 'active' : ''}`}
                  onClick={() => setSelectedDepartment(dept.id)}
                >
                  {dept.name}
                </button>
              ))}
            </div>

            {/* Doctors Info Bar */}
            <div className="doctors-info-bar">
              <span className="doctors-count">
                Showing {filteredDoctors.length} doctor{filteredDoctors.length !== 1 ? 's' : ''}
              </span>
              <Select
                className="sort-select"
                value={sortBy}
                onChange={setSortBy}
                size="small"
                style={{ width: 130 }}
                options={[
                  { value: 'name', label: 'Sort by: Name' },
                  { value: 'experience', label: 'Sort by: Exp' },
                  { value: 'fee', label: 'Sort by: Fee' },
                ]}
              />
            </div>

            {/* Doctor Cards Grid */}
            {filteredDoctors.length === 0 ? (
              <div className="empty-doctors">
                <UserOutlined />
                <h3>No doctors found</h3>
                <p>Try changing the department or search query</p>
              </div>
            ) : (
              <div className="doctor-cards-grid">
                {filteredDoctors.map((doctor) => {
                  const isSelected = selectedDoctor?.id === doctor.id;
                  const hasRealData = availabilityDate && Object.keys(doctorAvailability).length > 0;
                  const doctorSlots = doctorAvailability[doctor.id];
                  const isAvailable = !hasRealData || (doctorSlots && doctorSlots.length > 0);
                  const slotCount = doctorSlots?.length || 0;

                  return (
                    <div
                      key={doctor.id}
                      className={`doctor-card ${isSelected ? 'selected' : ''} ${hasRealData && !isAvailable ? 'unavailable' : ''}`}
                      onClick={() => {
                        setSelectedDoctor(doctor);
                        setSelectedTime(null);
                      }}
                    >
                      {/* Badge */}
                      <div
                        className={`doctor-card-badge ${isSelected ? 'badge-selected' : hasRealData && !isAvailable ? 'badge-unavailable' : 'badge-available'}`}
                      >
                        {isSelected ? (
                          <>
                            <CheckCircleOutlined /> Selected
                          </>
                        ) : hasRealData && !isAvailable ? (
                          <>Not Available</>
                        ) : hasRealData ? (
                          <>{slotCount} slot{slotCount !== 1 ? 's' : ''} open</>
                        ) : (
                          <>Available Today</>
                        )}
                      </div>

                      {/* Avatar */}
                      <div className="doctor-card-avatar">
                        <UserOutlined />
                      </div>

                      {/* Info */}
                      <div className="doctor-card-name">
                        Dr. {doctor.firstName} {doctor.lastName}
                      </div>
                      <div className="doctor-card-dept">
                        {doctor.department?.name || doctor.specialization || 'General'}
                      </div>

                      {/* Meta */}
                      <div className="doctor-card-meta">
                        {doctor.experience && (
                          <span>🎓 {doctor.experience} yrs exp</span>
                        )}
                        {doctor.consultationFee && (
                          <span>💰 ₹{doctor.consultationFee}</span>
                        )}
                      </div>

                      {/* Availability */}
                      <div className={`doctor-card-availability ${hasRealData && !isAvailable ? 'not-available' : 'available'}`}>
                        <span className={`availability-dot ${hasRealData && !isAvailable ? 'red' : 'green'}`} />
                        {hasRealData && !isAvailable
                          ? 'Not available on this date'
                          : hasRealData
                            ? `${slotCount} slot${slotCount !== 1 ? 's' : ''} available`
                            : 'Available Today'}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* RIGHT: Sidebar */}
          <div className="booking-sidebar">
            {/* Calendar */}
            <div className="sidebar-card">
              <div className="sidebar-card-title">
                <CalendarOutlined /> Select Date
              </div>
              <Calendar
                fullscreen={false}
                disabledDate={disabledDate}
                value={selectedDate || dayjs()}
                onSelect={(date) => {
                  if (!disabledDate(date)) {
                    setSelectedDate(date);
                    setSelectedTime(null);
                  }
                }}
              />
            </div>

            {/* Time Slots */}
            <div className="sidebar-card">
              <div className="sidebar-card-title">
                <ClockCircleOutlined /> Available Time Slots
              </div>
              {!selectedDate ? (
                <div className="summary-empty">Please select a date first</div>
              ) : availabilityLoading ? (
                <div className="summary-empty"><Spin size="small" /> Loading availability...</div>
              ) : (
                <>
                  <div className="time-section">
                    <div className="time-section-label">Morning</div>
                    <div className="time-slots-row">
                      {generateTimeSlots.morning.map((slot) => (
                        <button
                          key={slot.value}
                          className={`time-slot-btn ${selectedTime === slot.value ? 'selected' : ''} ${!slot.available ? 'disabled' : ''
                            }`}
                          onClick={() => slot.available && setSelectedTime(slot.value)}
                          disabled={!slot.available}
                        >
                          {slot.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="time-section">
                    <div className="time-section-label">Afternoon</div>
                    <div className="time-slots-row">
                      {generateTimeSlots.afternoon.map((slot) => (
                        <button
                          key={slot.value}
                          className={`time-slot-btn ${selectedTime === slot.value ? 'selected' : ''} ${!slot.available ? 'disabled' : ''
                            }`}
                          onClick={() => slot.available && setSelectedTime(slot.value)}
                          disabled={!slot.available}
                        >
                          {slot.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="time-section">
                    <div className="time-section-label">Evening</div>
                    <div className="time-slots-row">
                      {generateTimeSlots.evening.map((slot) => (
                        <button
                          key={slot.value}
                          className={`time-slot-btn ${selectedTime === slot.value ? 'selected' : ''} ${!slot.available ? 'disabled' : ''
                            }`}
                          onClick={() => slot.available && setSelectedTime(slot.value)}
                          disabled={!slot.available}
                        >
                          {slot.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Booking Summary */}
            <div className="sidebar-card">
              <div className="sidebar-card-title">
                <FileTextOutlined /> Booking Summary
              </div>
              {!selectedDoctor ? (
                <div className="summary-empty">Select a doctor to see booking details</div>
              ) : (
                <>
                  <div className="summary-rows">
                    <div className="summary-row">
                      <span className="label">Doctor</span>
                      <span className="value">
                        Dr. {selectedDoctor.firstName} {selectedDoctor.lastName}
                      </span>
                    </div>
                    <div className="summary-row">
                      <span className="label">Department</span>
                      <span className="value">
                        {selectedDoctor.department?.name || selectedDoctor.specialization || '-'}
                      </span>
                    </div>
                    <div className="summary-row">
                      <span className="label">Date</span>
                      <span className="value">
                        {selectedDate ? selectedDate.format('DD MMM YYYY') : '-'}
                      </span>
                    </div>
                    <div className="summary-row">
                      <span className="label">Time</span>
                      <span className="value">{selectedTime || '-'}</span>
                    </div>
                    {selectedDoctor.consultationFee && (
                      <div className="summary-row">
                        <span className="label">Consultation Fee</span>
                        <span className="value">₹{selectedDoctor.consultationFee}</span>
                      </div>
                    )}
                  </div>

                  <div className="summary-divider" />

                  {selectedDoctor.consultationFee && (
                    <div className="summary-total">
                      <span className="label">Total</span>
                      <span className="value">₹{selectedDoctor.consultationFee}</span>
                    </div>
                  )}

                  {/* Notes */}
                  <div className="booking-notes-area">
                    <label>Notes (optional)</label>
                    <TextArea
                      rows={2}
                      placeholder="Any special requirements..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      style={{ borderRadius: 8 }}
                    />
                  </div>

                  <button
                    className="confirm-booking-btn"
                    disabled={!canConfirm || submitting}
                    onClick={handleSubmit}
                    style={{ marginTop: 16 }}
                  >
                    <CalendarOutlined />
                    {submitting ? 'Booking...' : 'Confirm Booking'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookAppointmentStepper;
