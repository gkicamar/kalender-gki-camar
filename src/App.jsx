import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Users, 
  Shield, 
  Plus, 
  Trash2, 
  Edit2,
  CheckCircle, 
  AlertCircle, 
  LogOut, 
  LogIn, 
  Settings, 
  LayoutDashboard, 
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Filter,
  Printer,
  Eye,
  Image as ImageIcon
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc,
  updateDoc
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyD-dummy-key-for-gki-camar",
  authDomain: "kalender-gki-camar.firebaseapp.com",
  projectId: "kalender-gki-camar",
  storageBucket: "kalender-gki-camar.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const DEFAULT_DEPARTMENTS = [
  "Majelis Jemaat",
  "Wilayah 1",
  "Wilayah 2",
  "Wilayah 3",
  "Wilayah 4",
  "Komisi Anak",
  "Komisi Remaja",
  "Komisi Pemuda",
  "Komisi Dewasa",
  "Komisi Usinda",
  "Komisi Perlawatan",
  "Komisi Seni & Kreatifitas",
  "Panitia Bulan Keluarga",
  "Panitia Hari Raya Gerejawi",
  "Panitia Family Camp"
];

const DEFAULT_ROOMS = [
  "Ruang Ibadah Utama",
  "Ruang Ibadah Remaja & Pemuda",
  "Ruang RPP Lantai 1",
  "Ruang RPP Lantai 2",
  "Di luar gereja"
];

// Daftar Hari Libur Nasional
const ID_HOLIDAYS = {
  "2026-01-01": "Tahun Baru Masehi",
  "2026-02-14": "Isra Mi'raj",
  "2026-03-03": "Hari Suci Nyepi",
  "2026-03-19": "Idul Fitri",
  "2026-03-20": "Cuti Bersama Idul Fitri",
  "2026-04-03": "Wafat Yesus Kristus",
  "2026-05-01": "Hari Buruh",
  "2026-05-14": "Kenaikan Yesus Kristus",
  "2026-05-26": "Idul Adha",
  "2026-06-01": "Hari Lahir Pancasila",
  "2026-07-16": "Tahun Baru Islam",
  "2026-08-17": "Hari Kemerdekaan RI",
  "2026-12-25": "Hari Raya Natal"
};

const formatDateID = (dateStr) => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  const dateObj = new Date(y, m - 1, d);
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  return `${days[dateObj.getDay()]}, ${parseInt(d, 10)} ${months[dateObj.getMonth()]} ${y}`;
};

// Cek apakah jadwal sudah berlalu dari waktu saat ini
const isEventPast = (dateStr, endTimeStr) => {
  if (!dateStr || !endTimeStr) return false;
  const now = new Date();
  const eventEnd = new Date(`${dateStr}T${endTimeStr}:00`);
  return now > eventEnd;
};

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('calendar'); 
  const [events, setEvents] = useState([]);
  const [departments, setDepartments] = useState(DEFAULT_DEPARTMENTS);
  const [rooms, setRooms] = useState(DEFAULT_ROOMS);
  const [registeredAccounts, setRegisteredAccounts] = useState([]);
  
  // Filter States
  const [selectedDate, setSelectedDate] = useState(null); 
  const [filterDept, setFilterDept] = useState('Semua'); 
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  
  // Auth Form State
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [authDept, setAuthDept] = useState(DEFAULT_DEPARTMENTS[0]);
  const [authName, setAuthName] = useState('');
  const [authPass, setAuthPass] = useState('');
  const [authError, setAuthError] = useState('');
  
  // Event Form State
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventStartTime, setEventStartTime] = useState('09:00');
  const [eventEndTime, setEventEndTime] = useState('11:00');
  const [eventRoom, setEventRoom] = useState(DEFAULT_ROOMS[0]);
  const [eventDesc, setEventDesc] = useState('');
  const [eventFlyer, setEventFlyer] = useState(null);
  const [conflictWarning, setConflictWarning] = useState('');

  // Detail Modal State
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Settings Input State
  const [newDeptInput, setNewDeptInput] = useState('');
  const [newRoomInput, setNewRoomInput] = useState('');
  const [editingDeptIdx, setEditingDeptIdx] = useState(null);
  const [editDeptValue, setEditDeptValue] = useState('');
  const [editingRoomIdx, setEditingRoomIdx] = useState(null);
  const [editRoomValue, setEditRoomValue] = useState('');

  // Kelola Akun (PIC) State
  const [editingAccountId, setEditingAccountId] = useState(null);
  const [editAccountName, setEditAccountName] = useState('');
  const [editAccountPass, setEditAccountPass] = useState('');
  const [editAccountDept, setEditAccountDept] = useState('');
  const [accountSearch, setAccountSearch] = useState('');

  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "events"));
      const eventsList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      eventsList.sort((a, b) => new Date(a.date) - new Date(b.date) || a.startTime.localeCompare(b.startTime));
      setEvents(eventsList);

      const accountsSnap = await getDocs(collection(db, "accounts"));
      const accountsList = accountsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (accountsList.length > 0) {
        setRegisteredAccounts(accountsList);
      }
    } catch (e) {
      console.log("Mode offline aktif");
    }
  };

  const handleLoginRegister = async (e) => {
    e.preventDefault();
    setAuthError('');

    if (!authName.trim() || !authPass.trim()) {
      setAuthError('Nama PIC dan Password wajib diisi!');
      return;
    }

    const cleanName = authName.trim().toLowerCase();

    if (isRegister) {
      if (authDept !== "Majelis Jemaat") {
        const countDept = registeredAccounts.filter(acc => acc.department === authDept).length;
        if (countDept >= 3) {
          setAuthError(`Batas maksimal 3 akun untuk "${authDept}" telah tercapai.`);
          return;
        }
      }

      const existing = registeredAccounts.find(acc => acc.name.toLowerCase() === cleanName);
      if (existing) {
        setAuthError('Nama PIC ini sudah terdaftar! Silakan gunakan nama lain atau langsung Login.');
        return;
      }

      const newAcc = {
        department: authDept,
        name: authName.trim(),
        password: authPass,
        role: authDept === "Majelis Jemaat" ? "admin" : "member"
      };

      try {
        const docRef = await addDoc(collection(db, "accounts"), newAcc);
        setRegisteredAccounts([...registeredAccounts, { id: docRef.id, ...newAcc }]);
      } catch (err) {
        setRegisteredAccounts([...registeredAccounts, { id: Date.now().toString(), ...newAcc }]);
      }

      setUser({ department: newAcc.department, name: newAcc.name, role: newAcc.role });
      setIsAuthOpen(false);
      resetAuthForm();
    } else {
      const found = registeredAccounts.find(acc => acc.name.toLowerCase() === cleanName && acc.password === authPass);
      
      if (!found) {
        setAuthError('Nama PIC atau Password salah, atau akun belum terdaftar!');
        return;
      }

      if (found.department !== authDept) {
        setAuthError(`Akses Ditolak: Akun Anda terdaftar di "${found.department}", bukan "${authDept}".`);
        return;
      }

      setUser({ department: found.department, name: found.name, role: found.role });
      setIsAuthOpen(false);
      resetAuthForm();
    }
  };

  const resetAuthForm = () => {
    setAuthName('');
    setAuthPass('');
    setAuthError('');
  };

  const handleFlyerUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validasi ukuran agar database tidak bengkak
    if (file.size > 2 * 1024 * 1024) {
      alert("Ukuran flyer terlalu besar. Maksimal 2MB!");
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      // Kompresi image via Canvas
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        let width = img.width;
        let height = img.height;
        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6); // 60% quality
        setEventFlyer(dataUrl);
      };
      img.src = evt.target.result;
    };
    reader.readAsDataURL(file);
  };

  const checkConflict = (date, startTime, endTime, room, excludeId = null) => {
    if (room === "Di luar gereja") return false;
    return events.some(ev => {
      if (excludeId && ev.id === excludeId) return false;
      if (ev.date !== date || ev.room !== room) return false;
      return (startTime < ev.endTime && endTime > ev.startTime);
    });
  };

  const handleSaveEvent = async (e) => {
    e.preventDefault();
    setConflictWarning('');

    if (!eventTitle || !eventDate || !eventStartTime || !eventEndTime) {
      alert('Semua kolom wajib diisi!');
      return;
    }

    if (eventStartTime >= eventEndTime) {
      alert('Jam selesai harus lebih akhir dari jam mulai!');
      return;
    }

    if (checkConflict(eventDate, eventStartTime, eventEndTime, eventRoom, editingEventId)) {
      setConflictWarning(`⚠️ PENTING: Ruangan "${eventRoom}" sudah dipakai pada jam tersebut! Silakan pilih waktu/ruangan lain.`);
      return;
    }

    const eventData = {
      title: eventTitle,
      date: eventDate,
      startTime: eventStartTime,
      endTime: eventEndTime,
      room: eventRoom,
      department: user.department,
      pic: user.name,
      description: eventDesc,
      flyer: eventFlyer, // Simpan Data base64 Flyer
      updatedAt: new Date().toISOString()
    };

    try {
      let updatedEvents = [...events];
      if (editingEventId) {
        await updateDoc(doc(db, "events", editingEventId), eventData);
        updatedEvents = events.map(ev => ev.id === editingEventId ? { ...ev, ...eventData } : ev);
      } else {
        const docRef = await addDoc(collection(db, "events"), { ...eventData, createdAt: eventData.updatedAt });
        updatedEvents.push({ id: docRef.id, ...eventData });
      }
      updatedEvents.sort((a, b) => new Date(a.date) - new Date(b.date) || a.startTime.localeCompare(b.startTime));
      setEvents(updatedEvents);
      
      setIsEventModalOpen(false);
      resetEventForm();
    } catch (e) {
      let updatedEvents = [...events];
      if (editingEventId) {
        updatedEvents = events.map(ev => ev.id === editingEventId ? { ...ev, ...eventData } : ev);
      } else {
        updatedEvents.push({ id: Date.now().toString(), ...eventData });
      }
      updatedEvents.sort((a, b) => new Date(a.date) - new Date(b.date) || a.startTime.localeCompare(b.startTime));
      setEvents(updatedEvents);

      setIsEventModalOpen(false);
      resetEventForm();
    }
  };

  const openEditModal = (ev) => {
    setEditingEventId(ev.id);
    setEventTitle(ev.title);
    setEventDate(ev.date);
    setEventStartTime(ev.startTime);
    setEventEndTime(ev.endTime);
    setEventRoom(ev.room);
    setEventDesc(ev.description || '');
    setEventFlyer(ev.flyer || null);
    setIsEventModalOpen(true);
  };

  const resetEventForm = () => {
    setEditingEventId(null);
    setEventTitle('');
    setEventDate('');
    setEventStartTime('09:00');
    setEventEndTime('11:00');
    setEventDesc('');
    setEventFlyer(null);
    setConflictWarning('');
  };

  const handleDeleteEvent = async (id, eventDept) => {
    if (user.role !== 'admin' && user.department !== eventDept) {
      alert('Akses Ditolak: Anda hanya boleh menghapus jadwal milik Badan Pelayan Anda sendiri.');
      return;
    }
    if (window.confirm('Yakin ingin menghapus jadwal kegiatan ini?')) {
      try {
        await deleteDoc(doc(db, "events", id));
        setEvents(events.filter(ev => ev.id !== id));
      } catch (e) {
        setEvents(events.filter(ev => ev.id !== id));
      }
    }
  };

  const openEditAccount = (acc) => {
    setEditingAccountId(acc.id);
    setEditAccountName(acc.name);
    setEditAccountPass(acc.password);
    setEditAccountDept(acc.department);
  };

  const cancelEditAccount = () => {
    setEditingAccountId(null);
    setEditAccountName('');
    setEditAccountPass('');
    setEditAccountDept('');
  };

  const handleSaveAccount = async (accId) => {
    if (!editAccountName.trim() || !editAccountPass.trim()) {
      alert('Nama PIC dan Password wajib diisi!');
      return;
    }

    const cleanName = editAccountName.trim().toLowerCase();
    const duplicate = registeredAccounts.find(
      acc => acc.id !== accId && acc.name.toLowerCase() === cleanName
    );
    if (duplicate) {
      alert('Nama PIC ini sudah dipakai akun lain! Silakan gunakan nama lain.');
      return;
    }

    const updatedData = {
      name: editAccountName.trim(),
      password: editAccountPass,
      department: editAccountDept,
      role: editAccountDept === "Majelis Jemaat" ? "admin" : "member"
    };

    try {
      await updateDoc(doc(db, "accounts", accId), updatedData);
    } catch (e) {
      // Tetap update lokal walau offline
    }

    const updatedAccounts = registeredAccounts.map(acc =>
      acc.id === accId ? { ...acc, ...updatedData } : acc
    );
    setRegisteredAccounts(updatedAccounts);

    // Jika akun yang diedit adalah akun yang sedang login, sinkronkan sesi login saat ini
    const editedAccBefore = registeredAccounts.find(acc => acc.id === accId);
    if (user && editedAccBefore && user.name === editedAccBefore.name) {
      setUser({ department: updatedData.department, name: updatedData.name, role: updatedData.role });
    }

    cancelEditAccount();
  };

  const handleDeleteAccount = async (acc) => {
    if (acc.department === "Majelis Jemaat" && registeredAccounts.filter(a => a.department === "Majelis Jemaat").length <= 1) {
      alert('Tidak bisa menghapus. Minimal harus ada 1 akun Majelis Jemaat aktif.');
      return;
    }
    if (!window.confirm(`Yakin ingin menghapus akun "${acc.name}" (${acc.department})?`)) return;

    try {
      await deleteDoc(doc(db, "accounts", acc.id));
    } catch (e) {
      // Tetap hapus lokal walau offline
    }
    setRegisteredAccounts(registeredAccounts.filter(a => a.id !== acc.id));
  };

  const isAdmin = user && user.role === 'admin';

  const displayEventsCalendar = selectedDate ? events.filter(ev => ev.date === selectedDate) : events;
  
  // Filter Khusus Tabel: Berdasarkan Badan Pelayan dan Rentang Tanggal
  const displayEventsTable = events.filter(ev => {
    const matchDept = filterDept === 'Semua' || ev.department === filterDept;
    const matchStart = !filterStartDate || ev.date >= filterStartDate;
    const matchEnd = !filterEndDate || ev.date <= filterEndDate;
    return matchDept && matchStart && matchEnd;
  });

  const handlePrint = () => {
    window.print();
  };

  // Filter Kelola Akun berdasarkan pencarian nama/badan pelayan
  const displayAccounts = registeredAccounts.filter(acc => {
    const q = accountSearch.trim().toLowerCase();
    if (!q) return true;
    return acc.name.toLowerCase().includes(q) || acc.department.toLowerCase().includes(q);
  });

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay(); 
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));
    const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

    const blanks = Array.from({ length: firstDay });
    const days = Array.from({ length: daysInMonth });

    return (
      <div className="bg-white rounded-3xl p-6 shadow-md border border-blue-100 mb-8 print:hidden">
        <div className="flex justify-between items-center mb-6 px-2">
          <button onClick={prevMonth} className="p-2.5 bg-slate-50 hover:bg-blue-600 hover:text-white rounded-xl text-slate-600 transition shadow-sm">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h3 className="font-extrabold text-blue-900 text-xl uppercase tracking-widest drop-shadow-sm">
            {monthNames[month]} {year}
          </h3>
          <button onClick={nextMonth} className="p-2.5 bg-slate-50 hover:bg-blue-600 hover:text-white rounded-xl text-slate-600 transition shadow-sm">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        
        <div className="grid grid-cols-7 gap-2 md:gap-3">
          {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(d => (
            <div key={d} className={`text-center text-xs md:text-sm font-black pb-3 uppercase tracking-wider ${d === 'Min' ? 'text-red-500' : 'text-slate-400'}`}>
              {d}
            </div>
          ))}
          
          {blanks.map((_, i) => <div key={`blank-${i}`} className="p-3"></div>)}
          
          {days.map((_, i) => {
            const dateNum = i + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dateNum).padStart(2, '0')}`;
            const isSunday = new Date(year, month, dateNum).getDay() === 0;
            const holidayName = ID_HOLIDAYS[dateStr];
            const isRedDay = isSunday || holidayName;
            
            const dayEvents = events.filter(e => e.date === dateStr);
            const hasEvent = dayEvents.length > 0;
            const isSelected = selectedDate === dateStr;

            return (
              <div 
                key={dateNum} 
                onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                className={`relative flex flex-col items-center justify-center p-3 md:p-4 rounded-2xl border-2 transition cursor-pointer
                  ${isSelected ? 'border-blue-600 bg-blue-100 shadow-inner' : 
                    hasEvent ? 'border-blue-200 bg-blue-50/70 hover:border-blue-400' : 
                    'border-transparent hover:bg-slate-100'}`}
                title={holidayName ? `${holidayName}` : (hasEvent ? `${dayEvents.length} Kegiatan (Klik untuk lihat)` : 'Kosong')}
              >
                <span className={`text-sm md:text-base font-bold ${isRedDay ? 'text-red-600' : (isSelected ? 'text-blue-800' : 'text-slate-700')}`}>
                  {dateNum}
                </span>
                
                {hasEvent && (
                  <div className="absolute bottom-1.5 md:bottom-2 flex gap-1">
                    {dayEvents.slice(0, 3).map((_, idx) => (
                      <div key={idx} className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${isSelected ? 'bg-blue-600' : 'bg-blue-400'}`}></div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-6 flex flex-wrap gap-4 justify-end text-xs font-semibold text-slate-500">
          <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-blue-400"></div> Ada Kegiatan</span>
          <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-500"></div> Hari Libur / Minggu</span>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50/30 text-slate-800 font-sans pb-16">
      
      {/* HEADER UTAMA */}
      <header className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white shadow-xl sticky top-0 z-30 border-b-4 border-blue-600 print:hidden">
        <div className="max-w-6xl mx-auto px-6 py-5 flex flex-col md:flex-row justify-between items-center gap-5">
          
          <div className="flex items-center gap-4">
            <div className="bg-white p-1.5 rounded-xl shadow-lg w-14 h-14 flex items-center justify-center overflow-hidden shrink-0 border-2 border-blue-300/30">
              <img 
                src="/Logo GKI-Hitam.png" 
                alt="Logo GKI Camar" 
                className="w-full h-full object-contain"
                onError={(e) => { 
                  e.target.style.display = 'none'; 
                  e.target.nextSibling.style.display = 'block'; 
                }}
              />
              <CalendarDays className="w-8 h-8 text-blue-800 hidden" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-white">
                KALENDER GKI CAMAR
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3 bg-black/20 px-5 py-2.5 rounded-2xl border border-white/10 backdrop-blur-md shadow-inner">
                <div className="flex items-center gap-2">
                  {isAdmin ? (
                    <div className="bg-amber-400/20 p-1.5 rounded-full border border-amber-400/50">
                      <Shield className="w-4 h-4 text-amber-400 drop-shadow" />
                    </div>
                  ) : (
                    <div className="bg-blue-400/20 p-1.5 rounded-full border border-blue-400/50">
                      <Users className="w-4 h-4 text-blue-300 drop-shadow" />
                    </div>
                  )}
                  <div className="text-left">
                    <p className="text-xs font-bold text-white uppercase tracking-wide">{user.department}</p>
                    <p className="text-[10px] text-blue-200 font-medium">PIC: {user.name}</p>
                  </div>
                </div>

                <div className="w-px h-8 bg-white/20 mx-1"></div>

                <button 
                  onClick={() => setUser(null)}
                  className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-lg transition transform active:scale-95"
                >
                  <LogOut className="w-3.5 h-3.5" /> Keluar
                </button>
              </div>
            ) : (
              <button 
                onClick={() => { setIsAuthOpen(true); setIsRegister(false); setAuthError(''); resetAuthForm(); }}
                className="flex items-center gap-2 bg-white text-blue-900 hover:bg-blue-50 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-wider shadow-xl transition transform active:scale-95"
              >
                <LogIn className="w-4 h-4 text-blue-700" /> Login Badan Pelayan
              </button>
            )}
          </div>
        </div>
      </header>

      {/* NAVIGATION TABS */}
      <div className="max-w-6xl mx-auto px-6 mt-8 mb-4 print:hidden">
        <div className="flex border-b-2 border-blue-200/50 gap-8 text-sm font-bold overflow-x-auto no-scrollbar">
          <button 
            onClick={() => setView('calendar')}
            className={`pb-4 flex items-center gap-2.5 border-b-4 transition whitespace-nowrap px-2 ${view === 'calendar' ? 'border-blue-700 text-blue-900' : 'border-transparent text-slate-500 hover:text-blue-800'}`}
          >
            <CalendarIcon className="w-5 h-5" /> Kalender
          </button>
          
          <button 
            onClick={() => setView('kanban')}
            className={`pb-4 flex items-center gap-2.5 border-b-4 transition whitespace-nowrap px-2 ${view === 'kanban' ? 'border-blue-700 text-blue-900' : 'border-transparent text-slate-500 hover:text-blue-800'}`}
          >
            <LayoutDashboard className="w-5 h-5" /> Tabel Kegiatan
          </button>

          {isAdmin && (
            <button 
              onClick={() => setView('settings')}
              className={`pb-4 flex items-center gap-2.5 border-b-4 transition whitespace-nowrap px-2 ${view === 'settings' ? 'border-blue-700 text-blue-900' : 'border-transparent text-slate-500 hover:text-blue-800'}`}
            >
              <Settings className="w-5 h-5" /> Pengaturan Admin
            </button>
          )}
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <main className="max-w-6xl mx-auto px-6 print:m-0 print:p-0">
        
        {/* VIEW: KALENDAR GRID */}
        {view === 'calendar' && (
          <div className="space-y-2">
            {renderCalendar()}

            <div className="flex justify-between items-center bg-white/90 backdrop-blur-md p-6 rounded-3xl shadow-md border border-blue-100 flex-wrap gap-4 mt-8 mb-6 text-left print:hidden">
              <div className="flex-1 min-w-[250px]">
                <h2 className="text-xl font-black text-blue-950 uppercase tracking-wide">
                  {selectedDate ? `Agenda: ${formatDateID(selectedDate)}` : 'Daftar Agenda Kegiatan'}
                </h2>
                <p className="text-sm text-slate-500 font-medium mt-1">
                  {selectedDate ? 'Menampilkan jadwal di tanggal terpilih.' : 'Sistem deteksi bentrok ruangan real-time.'}
                </p>
              </div>

              <div className="flex items-center gap-3">
                {selectedDate && (
                  <button
                    onClick={() => setSelectedDate(null)}
                    className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm transition"
                  >
                    Tampilkan Semua
                  </button>
                )}

                {user ? (
                  <button
                    onClick={() => { resetEventForm(); setIsEventModalOpen(true); }}
                    className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-blue-700/30 transition transform active:scale-95"
                  >
                    <Plus className="w-4 h-4" /> Buat Jadwal Baru
                  </button>
                ) : (
                  <div className="text-xs bg-amber-50 text-amber-800 border border-amber-200/80 px-4 py-3 rounded-xl shadow-sm flex items-center gap-2 font-semibold">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Silakan <b>Login</b> untuk mengelola jadwal.</span>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayEventsCalendar.length === 0 ? (
                <div className="col-span-full py-20 text-center text-slate-400 bg-white/50 rounded-3xl border-2 border-dashed border-blue-100">
                  <CalendarDays className="w-16 h-16 mx-auto mb-4 opacity-20 text-blue-800" />
                  <p className="text-base font-bold text-slate-500">Tidak ada agenda di tanggal ini.</p>
                </div>
              ) : (
                displayEventsCalendar.map((ev) => {
                  const past = isEventPast(ev.date, ev.endTime);
                  
                  return (
                    <div key={ev.id} className={`rounded-3xl p-6 shadow-md hover:shadow-xl hover:-translate-y-1 border flex flex-col justify-between transition-all duration-300 relative text-left
                      ${past ? 'bg-slate-50 border-slate-200 opacity-80' : 'bg-white border-blue-50'}
                    `}>
                      <div>
                        <div className="flex justify-between items-start gap-2 mb-4">
                          <span className={`text-xs font-black uppercase tracking-wide px-3.5 py-1.5 rounded-xl border shadow-sm
                            ${past ? 'bg-slate-200 text-slate-500 border-slate-300' : 'bg-blue-50 text-blue-800 border-blue-100/60'}
                          `}>
                            {ev.department}
                          </span>
                          
                          <div className="flex gap-1.5">
                            {/* Tombol Detail/Flyer */}
                            <button 
                              onClick={() => { setSelectedEvent(ev); setDetailModalOpen(true); }}
                              className="text-blue-500 hover:text-white bg-blue-50 hover:bg-blue-600 p-2 rounded-xl transition shadow-sm"
                              title="Lihat Detail & Flyer"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {(isAdmin || (user && user.department === ev.department)) && (
                              <>
                                <button 
                                  onClick={() => openEditModal(ev)}
                                  className="text-slate-400 hover:text-white bg-slate-50 hover:bg-blue-500 p-2 rounded-xl transition shadow-sm"
                                  title="Edit Jadwal"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteEvent(ev.id, ev.department)}
                                  className="text-slate-400 hover:text-white bg-slate-50 hover:bg-rose-500 p-2 rounded-xl transition shadow-sm"
                                  title="Hapus Jadwal"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        <h3 className={`font-black text-lg mb-4 leading-tight ${past ? 'text-slate-500' : 'text-blue-950 drop-shadow-sm'}`}>
                          {ev.title}
                        </h3>
                        
                        <div className={`space-y-3 text-sm mb-5 p-4 rounded-2xl border ${past ? 'bg-slate-100/50 border-slate-200 text-slate-500' : 'text-slate-600 bg-slate-50/80 border-slate-100'}`}>
                          <div className="flex items-start gap-3">
                            <CalendarIcon className={`w-4 h-4 shrink-0 mt-0.5 ${past ? 'text-slate-400' : 'text-blue-600'}`} />
                            <span className="font-bold">{formatDateID(ev.date)}</span>
                          </div>
                          <div className="flex items-start gap-3">
                            <Clock className={`w-4 h-4 shrink-0 mt-0.5 ${past ? 'text-slate-400' : 'text-blue-600'}`} />
                            <span className="font-semibold">{ev.startTime} - {ev.endTime} WIB</span>
                          </div>
                          <div className="flex items-start gap-3">
                            <MapPin className={`w-4 h-4 shrink-0 mt-0.5 ${past ? 'text-slate-400' : 'text-blue-600'}`} />
                            <span className={`font-bold ${past ? 'text-slate-500' : 'text-blue-900'}`}>{ev.room}</span>
                          </div>
                        </div>

                        {ev.description && (
                          <div className={`p-4 rounded-2xl mb-5 border ${past ? 'bg-slate-100 border-slate-200' : 'bg-blue-50/50 border-blue-100/50'}`}>
                            <p className="text-sm whitespace-pre-wrap leading-relaxed font-medium line-clamp-3">
                              {ev.description}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="border-t-2 border-slate-100 pt-4 flex justify-between items-center text-xs font-semibold">
                        <span className="text-slate-400">PIC: <strong className="text-slate-700">{ev.pic}</strong></span>
                        {past ? (
                          <span className="flex items-center gap-1.5 text-slate-500 bg-slate-200 px-2.5 py-1 rounded-lg">
                            Selesai
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-blue-700 bg-blue-100/50 px-2.5 py-1 rounded-lg">
                            <CheckCircle className="w-3.5 h-3.5" /> Terkonfirmasi
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* VIEW: TABEL KANBAN / LIST */}
        {view === 'kanban' && (
          <div className="bg-white rounded-3xl shadow-lg border border-blue-100 overflow-hidden">
            <div className="p-6 border-b-2 border-slate-100 bg-slate-50/50 text-left print:hidden">
              <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
                <div className="flex-1">
                  <h2 className="text-xl font-black text-blue-950 uppercase tracking-wide">Daftar Jadwal Kegiatan GKI Camar</h2>
                  <p className="text-sm text-rose-600 font-semibold mt-1">
                    *Apabila ada kekeliruan dalam jadwal, mohon dapat diberitahukan kepada Majelis Jemaat.
                  </p>
                </div>
                
                {/* Header Actions & Filters */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 bg-white border-2 border-slate-200 rounded-xl px-3 py-1.5">
                    <span className="text-xs font-bold text-slate-500 uppercase">Dari:</span>
                    <input type="date" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} className="text-xs font-bold text-slate-700 focus:outline-none bg-transparent"/>
                    <span className="text-xs font-bold text-slate-500 uppercase ml-1">S/D:</span>
                    <input type="date" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} className="text-xs font-bold text-slate-700 focus:outline-none bg-transparent"/>
                  </div>

                  <div className="relative min-w-[180px]">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Filter className="w-4 h-4 text-slate-400" />
                    </div>
                    <select 
                      value={filterDept}
                      onChange={(e) => setFilterDept(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-700 bg-white focus:outline-none focus:border-blue-500 focus:ring-0 cursor-pointer appearance-none"
                    >
                      <option value="Semua">Semua Badan Pelayan</option>
                      {departments.map((d, i) => (
                        <option key={i} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={handlePrint}
                    className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md transition"
                    title="Cetak Mading / PDF"
                  >
                    <Printer className="w-4 h-4" /> Cetak
                  </button>

                  {user && (
                    <button
                      onClick={() => { resetEventForm(); setIsEventModalOpen(true); }}
                      className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-lg transition"
                    >
                      <Plus className="w-4 h-4" /> Jadwal Baru
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            {/* Tampilan Khusus Cetak Mading Header */}
            <div className="hidden print:block text-center p-6 pb-2">
              <h1 className="text-2xl font-black uppercase text-black">Jadwal Kegiatan GKI Camar</h1>
              {filterStartDate || filterEndDate ? (
                <p className="font-bold text-gray-700 text-sm mt-1">Periode: {formatDateID(filterStartDate)} - {formatDateID(filterEndDate)}</p>
              ) : null}
            </div>

            <div className="overflow-auto max-h-[65vh] print:max-h-none print:overflow-visible">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-slate-100 text-slate-600 uppercase font-black tracking-wider border-b-2 border-slate-200 sticky top-0 z-10 print:bg-white print:text-black print:border-b-4 print:border-black print:static">
                  <tr>
                    <th className="p-2.5">Tanggal & Waktu</th>
                    <th className="p-2.5">Nama Kegiatan</th>
                    <th className="p-2.5">Badan Pelayan</th>
                    <th className="p-2.5">Ruangan</th>
                    <th className="p-2.5">PIC / Status</th>
                    <th className="p-2.5 text-right print:hidden">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 print:divide-gray-300">
                  {displayEventsTable.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-10 text-center font-bold text-slate-400 text-base print:text-black">Belum ada data jadwal.</td>
                    </tr>
                  ) : (
                    displayEventsTable.map((ev) => {
                      const past = isEventPast(ev.date, ev.endTime);
                      return (
                        <tr key={ev.id} className={`transition ${past ? 'bg-slate-50/50 grayscale-[30%] print:grayscale-0 print:opacity-60' : 'hover:bg-blue-50/50'}`}>
                          <td className="p-2.5 font-bold text-slate-800 whitespace-nowrap print:text-black">
                            {formatDateID(ev.date)}<br/>
                            <span className="text-blue-600 font-semibold print:text-gray-800">{ev.startTime} - {ev.endTime} WIB</span>
                          </td>
                          <td className="p-2.5 font-black text-blue-950 text-sm print:text-black">{ev.title}</td>
                          <td className="p-2.5"><span className="bg-blue-100 text-blue-800 px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap print:bg-transparent print:border print:border-black print:text-black">{ev.department}</span></td>
                          <td className="p-2.5 font-bold text-slate-700 print:text-black">{ev.room}</td>
                          <td className="p-2.5">
                            <span className="font-semibold text-slate-600 print:text-black">{ev.pic}</span><br/>
                            {past ? (
                              <span className="text-[10px] uppercase font-bold text-slate-400 print:text-gray-500">Selesai</span>
                            ) : (
                              <span className="text-[10px] uppercase font-bold text-blue-600 print:text-black">Terkonfirmasi</span>
                            )}
                          </td>
                          <td className="p-2.5 text-right whitespace-nowrap print:hidden">
                            <div className="flex justify-end gap-1.5">
                              <button 
                                onClick={() => { setSelectedEvent(ev); setDetailModalOpen(true); }}
                                className="text-slate-400 hover:text-blue-600 hover:bg-blue-100 p-2 rounded-xl transition shadow-sm bg-white border border-slate-200"
                                title="Lihat Detail / Flyer"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {(isAdmin || (user && user.department === ev.department)) && (
                                <>
                                  <button 
                                    onClick={() => openEditModal(ev)}
                                    className="text-slate-400 hover:text-blue-600 hover:bg-blue-100 p-2 rounded-xl transition shadow-sm bg-white border border-slate-200"
                                    title="Edit"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteEvent(ev.id, ev.department)}
                                    className="text-slate-400 hover:text-rose-600 hover:bg-rose-100 p-2 rounded-xl transition shadow-sm bg-white border border-slate-200"
                                    title="Hapus"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VIEW: SETTINGS (ADMIN ONLY) */}
        {view === 'settings' && isAdmin && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 print:hidden">
            {/* Kelola Badan Pelayan */}
            <div className="bg-white rounded-3xl shadow-md border border-blue-100 p-8 text-left">
              <h2 className="text-lg font-black text-blue-950 mb-6 flex items-center gap-3 uppercase tracking-wide">
                <Users className="w-6 h-6 text-blue-600" /> Kelola Badan Pelayan
              </h2>
              <div className="space-y-3 mb-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {departments.map((dept, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-slate-50 px-4 py-3 rounded-2xl text-sm border border-slate-200/60">
                    {editingDeptIdx === idx ? (
                      <div className="flex items-center gap-2 w-full">
                        <input 
                          type="text" 
                          value={editDeptValue}
                          onChange={(e) => setEditDeptValue(e.target.value)}
                          className="flex-1 border-2 border-blue-300 rounded-xl p-2 text-sm font-bold text-slate-800 focus:outline-none focus:border-blue-600"
                        />
                        <button onClick={() => {
                          if (editDeptValue.trim()) {
                            const newDepts = [...departments];
                            newDepts[idx] = editDeptValue.trim();
                            setDepartments(newDepts);
                            setEditingDeptIdx(null);
                          }
                        }} className="text-white bg-blue-600 hover:bg-blue-700 p-2 rounded-xl shadow-sm"><Check className="w-4 h-4" /></button>
                        <button onClick={() => setEditingDeptIdx(null)} className="text-slate-500 bg-slate-200 hover:bg-slate-300 p-2 rounded-xl shadow-sm"><X className="w-4 h-4" /></button>
                      </div>
                    ) : (
                      <>
                        <span className="font-bold text-slate-700">{dept}</span>
                        {dept !== "Majelis Jemaat" && (
                          <div className="flex gap-2">
                            <button onClick={() => { setEditingDeptIdx(idx); setEditDeptValue(dept); }} className="text-slate-400 hover:text-blue-600 p-1.5 transition" title="Edit">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => setDepartments(departments.filter((_, i) => i !== idx))} className="text-slate-400 hover:text-rose-600 p-1.5 transition" title="Hapus">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <input 
                  type="text" 
                  placeholder="Ketik Nama Baru..." 
                  value={newDeptInput}
                  onChange={(e) => setNewDeptInput(e.target.value)}
                  className="flex-1 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-blue-500"
                />
                <button 
                  onClick={() => {
                    if(newDeptInput.trim() && !departments.includes(newDeptInput.trim())) {
                      setDepartments([...departments, newDeptInput.trim()]);
                      setNewDeptInput('');
                    }
                  }}
                  className="bg-blue-700 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-blue-800 transition shadow-lg"
                >
                  Tambah
                </button>
              </div>
            </div>

            {/* Kelola Ruangan */}
            <div className="bg-white rounded-3xl shadow-md border border-blue-100 p-8 text-left">
              <h2 className="text-lg font-black text-blue-950 mb-6 flex items-center gap-3 uppercase tracking-wide">
                <MapPin className="w-6 h-6 text-blue-600" /> Kelola Ruangan
              </h2>
              <div className="space-y-3 mb-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {rooms.map((room, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-slate-50 px-4 py-3 rounded-2xl text-sm border border-slate-200/60">
                    {editingRoomIdx === idx ? (
                      <div className="flex items-center gap-2 w-full">
                        <input 
                          type="text" 
                          value={editRoomValue}
                          onChange={(e) => setEditRoomValue(e.target.value)}
                          className="flex-1 border-2 border-blue-300 rounded-xl p-2 text-sm font-bold text-slate-800 focus:outline-none focus:border-blue-600"
                        />
                        <button onClick={() => {
                          if (editRoomValue.trim()) {
                            const newRooms = [...rooms];
                            newRooms[idx] = editRoomValue.trim();
                            setRooms(newRooms);
                            setEditingRoomIdx(null);
                          }
                        }} className="text-white bg-blue-600 hover:bg-blue-700 p-2 rounded-xl shadow-sm"><Check className="w-4 h-4" /></button>
                        <button onClick={() => setEditingRoomIdx(null)} className="text-slate-500 bg-slate-200 hover:bg-slate-300 p-2 rounded-xl shadow-sm"><X className="w-4 h-4" /></button>
                      </div>
                    ) : (
                      <>
                        <span className="font-bold text-slate-700">{room}</span>
                        <div className="flex gap-2">
                          <button onClick={() => { setEditingRoomIdx(idx); setEditRoomValue(room); }} className="text-slate-400 hover:text-blue-600 p-1.5 transition" title="Edit">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => setRooms(rooms.filter((_, i) => i !== idx))} className="text-slate-400 hover:text-rose-600 p-1.5 transition" title="Hapus">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <input 
                  type="text" 
                  placeholder="Ketik Ruangan Baru..." 
                  value={newRoomInput}
                  onChange={(e) => setNewRoomInput(e.target.value)}
                  className="flex-1 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-blue-500"
                />
                <button 
                  onClick={() => {
                    if(newRoomInput.trim() && !rooms.includes(newRoomInput.trim())) {
                      setRooms([...rooms, newRoomInput.trim()]);
                      setNewRoomInput('');
                    }
                  }}
                  className="bg-blue-700 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-blue-800 transition shadow-lg"
                >
                  Tambah
                </button>
              </div>
            </div>

            {/* Kelola Akun (PIC) - Khusus Majelis Jemaat */}
            <div className="bg-white rounded-3xl shadow-md border border-blue-100 p-8 text-left md:col-span-2">
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
                <h2 className="text-lg font-black text-blue-950 flex items-center gap-3 uppercase tracking-wide">
                  <Shield className="w-6 h-6 text-blue-600" /> Kelola Akun (PIC)
                </h2>
                <input
                  type="text"
                  placeholder="Cari nama PIC / Badan Pelayan..."
                  value={accountSearch}
                  onChange={(e) => setAccountSearch(e.target.value)}
                  className="w-full md:w-72 border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-black tracking-wider border-b-2 border-slate-200">
                    <tr>
                      <th className="p-3">Nama PIC</th>
                      <th className="p-3">Badan Pelayan</th>
                      <th className="p-3">Password</th>
                      <th className="p-3">Role</th>
                      <th className="p-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayAccounts.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="p-8 text-center font-bold text-slate-400">
                          {accountSearch ? 'Akun tidak ditemukan.' : 'Belum ada akun terdaftar.'}
                        </td>
                      </tr>
                    ) : (
                      displayAccounts.map((acc) => (
                        <tr key={acc.id} className="hover:bg-blue-50/40 transition">
                          {editingAccountId === acc.id ? (
                            <>
                              <td className="p-3">
                                <input
                                  type="text"
                                  value={editAccountName}
                                  onChange={(e) => setEditAccountName(e.target.value)}
                                  className="w-full border-2 border-blue-300 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 focus:outline-none focus:border-blue-600"
                                />
                              </td>
                              <td className="p-3">
                                <select
                                  value={editAccountDept}
                                  onChange={(e) => setEditAccountDept(e.target.value)}
                                  className="w-full border-2 border-blue-300 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 focus:outline-none focus:border-blue-600"
                                >
                                  {departments.map((d, i) => (
                                    <option key={i} value={d}>{d}</option>
                                  ))}
                                </select>
                              </td>
                              <td className="p-3">
                                <input
                                  type="text"
                                  value={editAccountPass}
                                  onChange={(e) => setEditAccountPass(e.target.value)}
                                  placeholder="Password baru"
                                  className="w-full border-2 border-blue-300 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 focus:outline-none focus:border-blue-600"
                                />
                              </td>
                              <td className="p-3 text-xs font-bold text-slate-400 uppercase">
                                {editAccountDept === "Majelis Jemaat" ? "Admin" : "Member"}
                              </td>
                              <td className="p-3 text-right">
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => handleSaveAccount(acc.id)}
                                    className="text-white bg-blue-600 hover:bg-blue-700 p-2 rounded-xl shadow-sm"
                                    title="Simpan"
                                  >
                                    <Check className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={cancelEditAccount}
                                    className="text-slate-500 bg-slate-200 hover:bg-slate-300 p-2 rounded-xl shadow-sm"
                                    title="Batal"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="p-3 font-bold text-slate-700">{acc.name}</td>
                              <td className="p-3">
                                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap">
                                  {acc.department}
                                </span>
                              </td>
                              <td className="p-3 font-mono text-slate-500">••••••••</td>
                              <td className="p-3">
                                {acc.role === 'admin' ? (
                                  <span className="flex items-center gap-1.5 text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg text-xs font-bold w-fit">
                                    <Shield className="w-3.5 h-3.5" /> Admin
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1.5 text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg text-xs font-bold w-fit">
                                    <Users className="w-3.5 h-3.5" /> Member
                                  </span>
                                )}
                              </td>
                              <td className="p-3 text-right">
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => openEditAccount(acc)}
                                    className="text-slate-400 hover:text-blue-600 hover:bg-blue-100 p-2 rounded-xl transition shadow-sm bg-white border border-slate-200"
                                    title="Edit Akun"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteAccount(acc)}
                                    className="text-slate-400 hover:text-rose-600 hover:bg-rose-100 p-2 rounded-xl transition shadow-sm bg-white border border-slate-200"
                                    title="Hapus Akun"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-slate-400 mt-4 font-medium">*Mengubah Badan Pelayan menjadi "Majelis Jemaat" otomatis menjadikan akun tersebut Admin.</p>
            </div>
          </div>
        )}
      </main>

      {/* MODAL AUTH */}
      {isAuthOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 border border-blue-100 animate-in fade-in zoom-in duration-200 text-left">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-blue-950 text-lg uppercase tracking-wide">
                {isRegister ? 'Pendaftaran Akun' : 'Login Sistem'}
              </h3>
              <button onClick={() => setIsAuthOpen(false)} className="text-slate-400 hover:text-slate-800 bg-slate-100 p-2 rounded-full font-bold">✕</button>
            </div>

            {authError && (
              <div className="mb-6 bg-rose-50 border-2 border-rose-200 text-rose-700 p-4 rounded-2xl text-sm flex items-center gap-3 shadow-sm font-semibold leading-snug">
                <AlertCircle className="w-6 h-6 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleLoginRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-wider">Badan Pelayan</label>
                <select 
                  value={authDept} 
                  onChange={(e) => setAuthDept(e.target.value)}
                  className="w-full border-2 border-slate-200 rounded-2xl p-3.5 text-sm focus:border-blue-600 focus:outline-none bg-slate-50/50 font-bold text-slate-700"
                >
                  {departments.map((d, i) => (
                    <option key={i} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-wider">Nama PIC</label>
                <input 
                  type="text" 
                  placeholder="Contoh: Bpk. Budi" 
                  value={authName}
                  onChange={(e) => setAuthName(e.target.value)}
                  className="w-full border-2 border-slate-200 rounded-2xl p-3.5 text-sm focus:border-blue-600 focus:outline-none bg-slate-50/50 font-bold text-slate-700"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-wider">Password</label>
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  value={authPass}
                  onChange={(e) => setAuthPass(e.target.value)}
                  className="w-full border-2 border-slate-200 rounded-2xl p-3.5 text-sm focus:border-blue-600 focus:outline-none bg-slate-50/50 font-bold text-slate-700"
                  required
                />
              </div>

              <div className="flex items-center gap-3 pt-2 pb-2">
                <input 
                  type="checkbox" 
                  id="regToggle" 
                  checked={isRegister} 
                  onChange={(e) => setIsRegister(e.target.checked)}
                  className="rounded text-blue-700 focus:ring-blue-600 w-5 h-5 cursor-pointer border-slate-300"
                />
                <label htmlFor="regToggle" className="text-sm text-slate-600 select-none cursor-pointer font-bold">
                  Buat akun baru (Jika belum terdaftar)
                </label>
              </div>

              <button 
                type="submit" 
                className="w-full bg-blue-700 hover:bg-blue-800 text-white font-black uppercase tracking-wider py-4 rounded-2xl text-sm shadow-xl shadow-blue-700/30 transition mt-2"
              >
                {isRegister ? 'Daftar Akun Baru' : 'Masuk (Login)'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL FORM JADWAL (BUAT & EDIT) */}
      {isEventModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-8 border border-blue-100 my-8 text-left">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-blue-950 text-lg uppercase tracking-wide">
                {editingEventId ? 'Edit Jadwal Kegiatan' : 'Form Pembuatan Jadwal'}
              </h3>
              <button onClick={() => { setIsEventModalOpen(false); resetEventForm(); }} className="text-slate-400 hover:text-slate-800 bg-slate-100 p-2 rounded-full font-bold">✕</button>
            </div>

            {conflictWarning && (
              <div className="mb-6 bg-amber-50 border-2 border-amber-200 text-amber-800 p-4 rounded-2xl text-sm flex items-start gap-3 shadow-sm font-semibold leading-snug">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
                <span>{conflictWarning}</span>
              </div>
            )}

            <form onSubmit={handleSaveEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-wider">Nama Kegiatan</label>
                <input 
                  type="text" 
                  placeholder="Contoh: Rapat Koordinasi..." 
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  className="w-full border-2 border-slate-200 rounded-2xl p-3.5 text-sm focus:border-blue-600 focus:outline-none bg-slate-50/50 font-bold text-slate-700"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-wider">Tanggal</label>
                  <input 
                    type="date" 
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full border-2 border-slate-200 rounded-2xl p-3.5 text-sm focus:border-blue-600 focus:outline-none bg-slate-50/50 font-bold text-slate-700"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-wider">Pilih Ruangan</label>
                  <select 
                    value={eventRoom}
                    onChange={(e) => setEventRoom(e.target.value)}
                    className="w-full border-2 border-slate-200 rounded-2xl p-3.5 text-sm focus:border-blue-600 focus:outline-none bg-slate-50/50 font-bold text-slate-700"
                  >
                    {rooms.map((r, i) => (
                      <option key={i} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-wider">Jam Mulai</label>
                  <input 
                    type="time" 
                    value={eventStartTime}
                    onChange={(e) => setEventStartTime(e.target.value)}
                    className="w-full border-2 border-slate-200 rounded-2xl p-3.5 text-sm focus:border-blue-600 focus:outline-none bg-slate-50/50 font-bold text-slate-700"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-wider">Jam Selesai</label>
                  <input 
                    type="time" 
                    value={eventEndTime}
                    onChange={(e) => setEventEndTime(e.target.value)}
                    className="w-full border-2 border-slate-200 rounded-2xl p-3.5 text-sm focus:border-blue-600 focus:outline-none bg-slate-50/50 font-bold text-slate-700"
                    required
                  />
                </div>
              </div>

              {/* Upload Flyer/Poster */}
              <div>
                <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-wider">Upload Flyer / Poster (Opsional)</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 bg-blue-50 text-blue-700 border-2 border-blue-200 px-4 py-3 rounded-xl cursor-pointer hover:bg-blue-100 transition font-bold text-sm">
                    <ImageIcon className="w-4 h-4" /> Pilih Gambar...
                    <input type="file" accept="image/*" onChange={handleFlyerUpload} className="hidden" />
                  </label>
                  {eventFlyer && (
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-12 rounded-lg overflow-hidden border-2 border-slate-200">
                        <img src={eventFlyer} alt="Flyer Preview" className="w-full h-full object-cover" />
                      </div>
                      <button type="button" onClick={() => setEventFlyer(null)} className="text-rose-500 text-xs font-bold hover:underline">Hapus</button>
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-2 font-medium">*Poster akan dikompresi otomatis (Maksimal 2MB).</p>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-wider">Catatan Tambahan (Bisa multi baris)</label>
                <textarea 
                  rows="3"
                  placeholder="Keterangan acara / Info konsumsi dll..." 
                  value={eventDesc}
                  onChange={(e) => setEventDesc(e.target.value)}
                  className="w-full border-2 border-slate-200 rounded-2xl p-3.5 text-sm focus:border-blue-600 focus:outline-none bg-slate-50/50 font-medium text-slate-700 resize-y"
                />
              </div>

              <button 
                type="submit" 
                className="w-full bg-blue-700 hover:bg-blue-800 text-white font-black uppercase tracking-wider py-4 rounded-2xl text-sm shadow-xl shadow-blue-700/30 transition mt-4"
              >
                {editingEventId ? 'Simpan Perubahan Jadwal' : 'Simpan & Cek Konflik'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL LIHAT DETAIL & FLYER */}
      {detailModalOpen && selectedEvent && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col text-left border border-slate-200 overflow-hidden">
            {/* Header Modal - terkunci di atas, tidak ikut scroll */}
            <div className="bg-slate-50 p-6 flex justify-between items-center border-b border-slate-200 shrink-0">
              <h3 className="font-black text-blue-950 text-lg uppercase tracking-wide">Detail Kegiatan</h3>
              <button onClick={() => { setDetailModalOpen(false); setSelectedEvent(null); }} className="text-slate-400 hover:text-rose-500 bg-white shadow-sm p-2 rounded-full font-bold transition shrink-0">✕</button>
            </div>
            
            {/* Konten - area yang bisa discroll */}
            <div className="p-6 md:p-8 overflow-y-auto">
              <div className="flex justify-between items-start mb-4">
                <span className="bg-blue-100 text-blue-800 px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wide">
                  {selectedEvent.department}
                </span>
                {isEventPast(selectedEvent.date, selectedEvent.endTime) && (
                  <span className="bg-slate-200 text-slate-500 px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wide">
                    Telah Selesai
                  </span>
                )}
              </div>

              <h2 className="text-2xl font-black text-slate-800 mb-6">{selectedEvent.title}</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-1">Tanggal</p>
                  <p className="font-bold text-slate-700 flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-blue-600" /> {formatDateID(selectedEvent.date)}
                  </p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-1">Waktu</p>
                  <p className="font-bold text-slate-700 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-600" /> {selectedEvent.startTime} - {selectedEvent.endTime} WIB
                  </p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 md:col-span-2">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-1">Ruangan & Lokasi</p>
                  <p className="font-bold text-blue-900 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-600" /> {selectedEvent.room}
                  </p>
                </div>
              </div>

              {selectedEvent.description && (
                <div className="mb-6">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-2">Keterangan Tambahan</p>
                  <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 text-sm font-medium text-slate-600 whitespace-pre-wrap leading-relaxed">
                    {selectedEvent.description}
                  </div>
                </div>
              )}

              {selectedEvent.flyer && (
                <div className="mt-6 border-t border-slate-100 pt-6">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-4 text-center">Flyer / Poster Acara</p>
                  <div className="rounded-2xl overflow-hidden shadow-lg border border-slate-200 bg-slate-100 flex items-center justify-center max-h-[50vh]">
                    <img src={selectedEvent.flyer} alt="Flyer Kegiatan" className="max-w-full max-h-[50vh] w-auto h-auto object-contain" />
                  </div>
                </div>
              )}

              <div className="mt-8 flex justify-end text-xs font-semibold text-slate-400">
                <p>Diajukan oleh (PIC): <span className="text-slate-700">{selectedEvent.pic}</span></p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}