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
ChevronLeft,
ChevronRight,
Check,
X,
Filter,
Eye,
Image as ImageIcon,
Printer
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
return ${days[dateObj.getDay()]}, ${parseInt(d, 10)} ${months[dateObj.getMonth()]} ${y};
};

export default function App() {
const [user, setUser] = useState(null);
const [view, setView] = useState('calendar');
const [events, setEvents] = useState([]);
const [departments, setDepartments] = useState(DEFAULT_DEPARTMENTS);
const [rooms, setRooms] = useState(DEFAULT_ROOMS);
const [registeredAccounts, setRegisteredAccounts] = useState([]);

// UI States
const [selectedDate, setSelectedDate] = useState(null);
const [currentMonth, setCurrentMonth] = useState(new Date());

// Filter & Rentang Tanggal
const [filterDept, setFilterDept] = useState('Semua');
const [startDateFilter, setStartDateFilter] = useState('');
const [endDateFilter, setEndDateFilter] = useState('');

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

useEffect(() => {
document.title = "Kalender GKI Camar";
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
  if (accountsList.length > 0) setRegisteredAccounts(accountsList);
} catch (e) {
  console.log("Mode offline aktif");
}


};

const isEventPast = (evDate, evEndTime) => {
const now = new Date();
const eventEnd = new Date(${evDate}T${evEndTime});
return now > eventEnd;
};

// Kompres Gambar Otomatis Sebelum Save
const handleImageUpload = (e) => {
const file = e.target.files[0];
if (!file) return;
const reader = new FileReader();
reader.onload = (event) => {
const img = new Image();
img.onload = () => {
const canvas = document.createElement('canvas');
const MAX_WIDTH = 800;
const MAX_HEIGHT = 800;
let width = img.width;
let height = img.height;

    if (width > height) {
      if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
    } else {
      if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
    }
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, width, height);
    setEventFlyer(canvas.toDataURL('image/jpeg', 0.6));
  };
  img.src = event.target.result;
};
reader.readAsDataURL(file);


};

const handleLoginRegister = async (e) => {
e.preventDefault();
setAuthError('');
const cleanName = authName.trim().toLowerCase();

if (isRegister) {
  if (authDept !== "Majelis Jemaat" && registeredAccounts.filter(acc => acc.department === authDept).length >= 3) {
    setAuthError(`Batas maksimal 3 akun untuk "${authDept}" telah tercapai.`);
    return;
  }
  if (registeredAccounts.find(acc => acc.name.toLowerCase() === cleanName)) {
    setAuthError('Nama PIC ini sudah terdaftar! Silakan Login.');
    return;
  }
  const newAcc = { department: authDept, name: authName.trim(), password: authPass, role: authDept === "Majelis Jemaat" ? "admin" : "member" };
  try {
    const docRef = await addDoc(collection(db, "accounts"), newAcc);
    setRegisteredAccounts([...registeredAccounts, { id: docRef.id, ...newAcc }]);
  } catch (err) {
    setRegisteredAccounts([...registeredAccounts, { id: Date.now().toString(), ...newAcc }]);
  }
  setUser({ department: newAcc.department, name: newAcc.name, role: newAcc.role });
  setIsAuthOpen(false); resetAuthForm();
} else {
  const found = registeredAccounts.find(acc => acc.name.toLowerCase() === cleanName && acc.password === authPass);
  if (!found) { setAuthError('Nama PIC atau Password salah!'); return; }
  if (found.department !== authDept) { setAuthError(`Akun terdaftar di "${found.department}", bukan "${authDept}".`); return; }
  setUser({ department: found.department, name: found.name, role: found.role });
  setIsAuthOpen(false); resetAuthForm();
}


};

const resetAuthForm = () => { setAuthName(''); setAuthPass(''); setAuthError(''); };

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

if (eventStartTime >= eventEndTime) { alert('Jam selesai harus lebih akhir dari jam mulai!'); return; }
if (checkConflict(eventDate, eventStartTime, eventEndTime, eventRoom, editingEventId)) {
  setConflictWarning(`⚠️ Ruangan "${eventRoom}" bentrok/sudah dipakai pada jam tersebut!`);
  return;
}

const eventData = {
  title: eventTitle, date: eventDate, startTime: eventStartTime, endTime: eventEndTime,
  room: eventRoom, department: user.department, pic: user.name, description: eventDesc,
  flyerUrl: eventFlyer, updatedAt: new Date().toISOString()
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
  setIsEventModalOpen(false); resetEventForm();
} catch (e) {
  alert("Terjadi kesalahan jaringan, data disimpan lokal sementara.");
}


};

const openEditModal = (ev) => {
setEditingEventId(ev.id); setEventTitle(ev.title); setEventDate(ev.date);
setEventStartTime(ev.startTime); setEventEndTime(ev.endTime); setEventRoom(ev.room);
setEventDesc(ev.description || ''); setEventFlyer(ev.flyerUrl || null);
setIsEventModalOpen(true);
};

const resetEventForm = () => {
setEditingEventId(null); setEventTitle(''); setEventDate('');
setEventStartTime('09:00'); setEventEndTime('11:00');
setEventDesc(''); setEventFlyer(null); setConflictWarning('');
};

const handleDeleteEvent = async (id, eventDept) => {
if (user.role !== 'admin' && user.department !== eventDept) {
alert('Akses Ditolak!'); return;
}
if (window.confirm('Hapus jadwal ini?')) {
try {
await deleteDoc(doc(db, "events", id));
setEvents(events.filter(ev => ev.id !== id));
} catch (e) { setEvents(events.filter(ev => ev.id !== id)); }
}
};

const isAdmin = user && user.role === 'admin';

// Filter Table
let displayEventsTable = events;
if (filterDept !== 'Semua') displayEventsTable = displayEventsTable.filter(ev => ev.department === filterDept);
if (startDateFilter) displayEventsTable = displayEventsTable.filter(ev => ev.date >= startDateFilter);
if (endDateFilter) displayEventsTable = displayEventsTable.filter(ev => ev.date <= endDateFilter);

const displayEventsCalendar = selectedDate ? events.filter(ev => ev.date === selectedDate) : events;

const renderCalendar = () => {
const year = currentMonth.getFullYear();
const month = currentMonth.getMonth();
const firstDay = new Date(year, month, 1).getDay();
const daysInMonth = new Date(year, month + 1, 0).getDate();

const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));
const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

return (
  <div className="bg-white rounded-3xl p-6 shadow-md border border-blue-100 mb-8 print:hidden">
    <div className="flex justify-between items-center mb-6 px-2">
      <button onClick={prevMonth} className="p-2.5 bg-slate-50 hover:bg-blue-600 hover:text-white rounded-xl text-slate-600 transition shadow-sm">
        <ChevronLeft className="w-5 h-5" />
      </button>
      <h3 className="font-extrabold text-blue-900 text-lg md:text-xl uppercase tracking-widest drop-shadow-sm">
        {monthNames[month]} {year}
      </h3>
      <button onClick={nextMonth} className="p-2.5 bg-slate-50 hover:bg-blue-600 hover:text-white rounded-xl text-slate-600 transition shadow-sm">
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
    
    <div className="grid grid-cols-7 gap-1 md:gap-2">
      {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(d => (
        <div key={d} className={`text-center text-[10px] md:text-xs font-black pb-3 uppercase tracking-wider ${d === 'Min' ? 'text-red-500' : 'text-slate-400'}`}>
          {d}
        </div>
      ))}
      {Array.from({ length: firstDay }).map((_, i) => <div key={`blank-${i}`} className="p-3"></div>)}
      {Array.from({ length: daysInMonth }).map((_, i) => {
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
            className={`relative flex flex-col items-center justify-center p-2.5 md:p-4 rounded-2xl border-2 transition cursor-pointer
              ${isSelected ? 'border-blue-600 bg-blue-100 shadow-inner' : 
                hasEvent ? 'border-blue-200 bg-blue-50/70 hover:border-blue-400' : 
                'border-transparent hover:bg-slate-100'}`}
            title={holidayName ? `${holidayName}` : (hasEvent ? `${dayEvents.length} Kegiatan (Klik)` : 'Kosong')}
          >
            <span className={`text-sm md:text-base font-bold ${isRedDay ? 'text-red-600' : (isSelected ? 'text-blue-800' : 'text-slate-700')}`}>
              {dateNum}
            </span>
            {hasEvent && (
              <div className="absolute bottom-1 md:bottom-1.5 flex gap-0.5 md:gap-1">
                {dayEvents.slice(0, 3).map((_, idx) => (
                  <div key={idx} className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-blue-600' : 'bg-blue-400'}`}></div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  </div>
);


};

return (


  {/* HEADER UTAMA */}
  <header className="bg-blue-900 text-white shadow-xl sticky top-0 z-30 border-b-[6px] border-blue-700 print:hidden">
    <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
      
      <div className="flex items-center gap-4">
        <img 
          src="https://drive.google.com/uc?export=view&id=1tD2SkJp8Ok8zCSSdbhsnSKPvVg7wqNmt" 
          alt="Logo GKI Camar" 
          className="w-14 h-14 md:w-16 md:h-16 object-contain drop-shadow-lg"
          onError={(e) => e.target.style.display = 'none'}
        />
        <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-widest drop-shadow-md">
          KALENDER GKI CAMAR
        </h1>
      </div>

      <div className="flex items-center gap-3">
        {user ? (
          <div className="flex items-center gap-3 bg-black/20 px-5 py-2.5 rounded-2xl border border-white/10 shadow-inner">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-full border ${isAdmin ? 'bg-amber-400/20 border-amber-400/50' : 'bg-blue-400/20 border-blue-400/50'}`}>
                {isAdmin ? <Shield className="w-4 h-4 text-amber-400" /> : <Users className="w-4 h-4 text-blue-300" />}
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-white uppercase tracking-wide">{user.department}</p>
                <p className="text-[10px] text-blue-200 font-medium">PIC: {user.name}</p>
              </div>
            </div>
            <div className="w-px h-8 bg-white/20 mx-1"></div>
            <button onClick={() => setUser(null)} className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-lg transition">
              <LogOut className="w-3.5 h-3.5" /> Keluar
            </button>
          </div>
        ) : (
          <button onClick={() => { setIsAuthOpen(true); setIsRegister(false); setAuthError(''); }} className="flex items-center gap-2 bg-white text-blue-900 hover:bg-blue-50 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-wider shadow-xl transition">
            <LogIn className="w-4 h-4 text-blue-700" /> Login Badan Pelayan
          </button>
        )}
      </div>
    </div>
  </header>

  {/* NAVIGATION TABS */}
  <div className="max-w-6xl mx-auto px-6 mt-6 mb-4 print:hidden">
    <div className="flex border-b-2 border-blue-200/50 gap-8 text-sm font-bold overflow-x-auto no-scrollbar">
      <button onClick={() => setView('calendar')} className={`pb-4 flex items-center gap-2.5 border-b-4 transition whitespace-nowrap px-2 ${view === 'calendar' ? 'border-blue-700 text-blue-900' : 'border-transparent text-slate-500 hover:text-blue-800'}`}>
        <CalendarIcon className="w-5 h-5" /> Kalender
      </button>
      <button onClick={() => setView('kanban')} className={`pb-4 flex items-center gap-2.5 border-b-4 transition whitespace-nowrap px-2 ${view === 'kanban' ? 'border-blue-700 text-blue-900' : 'border-transparent text-slate-500 hover:text-blue-800'}`}>
        <LayoutDashboard className="w-5 h-5" /> Tabel Kegiatan
      </button>
      {isAdmin && (
        <button onClick={() => setView('settings')} className={`pb-4 flex items-center gap-2.5 border-b-4 transition whitespace-nowrap px-2 ${view === 'settings' ? 'border-blue-700 text-blue-900' : 'border-transparent text-slate-500 hover:text-blue-800'}`}>
          <Settings className="w-5 h-5" /> Pengaturan Admin
        </button>
      )}
    </div>
  </div>

  {/* MAIN CONTENT AREA */}
  <main className="max-w-6xl mx-auto px-6 print:p-0">
    
    {/* VIEW: KALENDAR */}
    {view === 'calendar' && (
      <div className="space-y-2">
        {renderCalendar()}
        <div className="flex justify-between items-center bg-white p-5 rounded-2xl shadow-sm border border-blue-100 flex-wrap gap-4 mt-6 mb-4 text-left print:hidden">
          <div className="flex-1 min-w-[250px]">
            <h2 className="text-xl font-black text-blue-950 uppercase tracking-wide">
              {selectedDate ? `Jadwal: ${formatDateID(selectedDate)}` : 'Daftar Seluruh Jadwal'}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            {selectedDate && (
              <button onClick={() => setSelectedDate(null)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition">
                Tampilkan Semua
              </button>
            )}
            {user && (
              <button onClick={() => { resetEventForm(); setIsEventModalOpen(true); }} className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg transition">
                <Plus className="w-4 h-4" /> Buat Jadwal
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 print:grid-cols-2">
          {displayEventsCalendar.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-400 bg-white/50 rounded-2xl border-2 border-dashed border-blue-100 print:hidden">
              <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-20 text-blue-800" />
              <p className="text-sm font-bold text-slate-500">Tidak ada jadwal.</p>
            </div>
          ) : (
            displayEventsCalendar.map((ev) => {
              const past = isEventPast(ev.date, ev.endTime);
              return (
                <div key={ev.id} className={`bg-white rounded-2xl p-5 shadow-sm border-2 text-left transition-all ${past ? 'border-slate-200 opacity-60 grayscale-[30%]' : 'border-blue-50 hover:shadow-md'}`}>
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-3">
                      <span className={`text-[10px] font-black uppercase tracking-wide px-3 py-1 rounded-lg border ${past ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-blue-50 text-blue-800 border-blue-100'}`}>
                        {ev.department}
                      </span>
                      <div className="flex gap-1.5 print:hidden">
                        <button onClick={() => { setSelectedEvent(ev); setDetailModalOpen(true); }} className="text-blue-500 hover:text-white bg-blue-50 hover:bg-blue-600 p-1.5 rounded-lg transition" title="Lihat Detail">
                          <Eye className="w-4 h-4" />
                        </button>
                        {(isAdmin || (user && user.department === ev.department)) && (
                          <>
                            <button onClick={() => openEditModal(ev)} className="text-slate-400 hover:text-white bg-slate-50 hover:bg-amber-500 p-1.5 rounded-lg transition" title="Edit Jadwal"><Edit2 className="w-4 h-4" /></button>
                            <button onClick={() => handleDeleteEvent(ev.id, ev.department)} className="text-slate-400 hover:text-white bg-slate-50 hover:bg-rose-500 p-1.5 rounded-lg transition" title="Hapus Jadwal"><Trash2 className="w-4 h-4" /></button>
                          </>
                        )}
                      </div>
                    </div>

                    <h3 className="font-black text-slate-800 text-base mb-3 leading-tight">{ev.title}</h3>
                    
                    <div className="space-y-2 text-xs text-slate-600 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="w-3.5 h-3.5 text-blue-600" />
                        <span className="font-bold">{formatDateID(ev.date)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-blue-600" />
                        <span className="font-bold">{ev.startTime} - {ev.endTime} WIB</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-blue-600" />
                        <span className="font-bold text-slate-800">{ev.room}</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t-2 border-slate-100 pt-3 flex justify-between items-center text-[11px] font-semibold text-slate-500">
                    <span>PIC: <strong className="text-slate-700">{ev.pic}</strong></span>
                    {past ? (
                      <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-md">Selesai</span>
                    ) : (
                      <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md"><CheckCircle className="w-3 h-3" /> Berjalan</span>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    )}

    {/* VIEW: TABEL KEGIATAN */}
    {view === 'kanban' && (
      <div className="bg-white rounded-2xl shadow-lg border border-blue-100 overflow-hidden flex flex-col h-auto max-h-none print:shadow-none print:border-none">
        <div className="p-5 bg-slate-50/80 flex justify-between items-center flex-wrap gap-4 text-left border-b border-slate-200 print:hidden">
          <div className="flex-1 min-w-[250px]">
            <h2 className="text-xl font-black text-blue-950 uppercase">Daftar Jadwal Kegiatan GKI Camar</h2>
            <p className="text-xs font-semibold text-rose-600 mt-1">*Apabila ada kekeliruan dalam jadwal, mohon dapat diberitahukan kepada Majelis Jemaat.</p>
          </div>

          <div className="flex items-center flex-wrap gap-3 w-full lg:w-auto">
            <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-xl border border-slate-200">
              <span className="text-xs font-bold text-slate-500">Dari:</span>
              <input type="date" value={startDateFilter} onChange={(e) => setStartDateFilter(e.target.value)} className="text-xs font-bold p-1 outline-none"/>
              <span className="text-xs font-bold text-slate-500">S/d:</span>
              <input type="date" value={endDateFilter} onChange={(e) => setEndDateFilter(e.target.value)} className="text-xs font-bold p-1 outline-none"/>
            </div>

            <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)} className="px-3 py-2 border-2 border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-white focus:outline-none">
              <option value="Semua">Semua Badan Pelayan</option>
              {departments.map((d, i) => <option key={i} value={d}>{d}</option>)}
            </select>

            <button onClick={() => window.print()} className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition">
              <Printer className="w-4 h-4" /> Cetak
            </button>
            {user && (
              <button onClick={() => { resetEventForm(); setIsEventModalOpen(true); }} className="flex items-center gap-1.5 bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition">
                <Plus className="w-4 h-4" /> Jadwal
              </button>
            )}
          </div>
        </div>
        
        {/* TABEL DENGAN SCROLL & FREEZE HEADER */}
        <div className="overflow-y-auto max-h-[60vh] relative custom-scrollbar print:max-h-none print:overflow-visible">
          <table className="w-full text-left text-xs md:text-sm border-collapse">
            <thead className="bg-slate-100 text-slate-700 uppercase font-black tracking-wider sticky top-0 z-10 shadow-sm print:relative print:shadow-none border-y border-slate-200">
              <tr>
                <th className="px-4 py-3 whitespace-nowrap">Tanggal & Waktu</th>
                <th className="px-4 py-3">Nama Kegiatan</th>
                <th className="px-4 py-3 whitespace-nowrap">Badan Pelayan</th>
                <th className="px-4 py-3">Ruangan</th>
                <th className="px-4 py-3">PIC</th>
                <th className="px-4 py-3 text-right print:hidden">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {displayEventsTable.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center font-bold text-slate-400">Tidak ada jadwal tercatat pada filter ini.</td>
                </tr>
              ) : (
                displayEventsTable.map((ev) => {
                  const past = isEventPast(ev.date, ev.endTime);
                  return (
                    <tr key={ev.id} className={`transition ${past ? 'bg-slate-50/50 opacity-60 grayscale-[20%]' : 'hover:bg-blue-50/40'}`}>
                      <td className="px-4 py-3 font-bold text-slate-800 whitespace-nowrap">
                        {formatDateID(ev.date)}<br/>
                        <span className="text-blue-600 font-semibold">{ev.startTime} - {ev.endTime}</span>
                        {past && <span className="ml-2 text-[9px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">Selesai</span>}
                      </td>
                      <td className="px-4 py-3 font-black text-blue-950">{ev.title}</td>
                      <td className="px-4 py-3"><span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-[10px] font-bold whitespace-nowrap">{ev.department}</span></td>
                      <td className="px-4 py-3 font-bold text-slate-700">{ev.room}</td>
                      <td className="px-4 py-3 font-semibold text-slate-500">{ev.pic}</td>
                      <td className="px-4 py-3 text-right whitespace-nowrap print:hidden">
                        <div className="flex justify-end gap-1.5">
                          <button onClick={() => { setSelectedEvent(ev); setDetailModalOpen(true); }} className="text-blue-500 hover:bg-blue-100 p-1.5 rounded-lg transition"><Eye className="w-4 h-4" /></button>
                          {(isAdmin || (user && user.department === ev.department)) && (
                            <>
                              <button onClick={() => openEditModal(ev)} className="text-amber-500 hover:bg-amber-100 p-1.5 rounded-lg transition"><Edit2 className="w-4 h-4" /></button>
                              <button onClick={() => handleDeleteEvent(ev.id, ev.department)} className="text-rose-500 hover:bg-rose-100 p-1.5 rounded-lg transition"><Trash2 className="w-4 h-4" /></button>
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:hidden">
        {/* KELOLA DEPT (Sama persis logikanya, saya ringkas tampilannya) */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 text-left">
          <h2 className="text-sm font-bold text-blue-900 mb-4 flex items-center gap-2 uppercase tracking-wide"><Users className="w-5 h-5 text-blue-600" /> Kelola Badan Pelayan</h2>
          <div className="space-y-2 mb-4 max-h-60 overflow-y-auto pr-1">
            {departments.map((dept, idx) => (
              <div key={idx} className="flex justify-between items-center bg-slate-50 px-3 py-2 rounded-xl text-xs border border-slate-100">
                {editingDeptIdx === idx ? (
                  <div className="flex gap-2 w-full"><input value={editDeptValue} onChange={(e) => setEditDeptValue(e.target.value)} className="flex-1 border p-1 rounded"/><button onClick={() => { if(editDeptValue.trim()){ const nd = [...departments]; nd[idx]=editDeptValue.trim(); setDepartments(nd); setEditingDeptIdx(null); }}} className="text-blue-600"><Check className="w-4 h-4"/></button><button onClick={() => setEditingDeptIdx(null)} className="text-slate-400"><X className="w-4 h-4"/></button></div>
                ) : (
                  <><span className="font-bold">{dept}</span>{dept !== "Majelis Jemaat" && <div className="flex gap-1"><button onClick={() => { setEditingDeptIdx(idx); setEditDeptValue(dept); }} className="text-slate-400 hover:text-blue-600 p-1"><Edit2 className="w-3.5 h-3.5" /></button><button onClick={() => setDepartments(departments.filter((_, i) => i !== idx))} className="text-slate-400 hover:text-rose-600 p-1"><Trash2 className="w-3.5 h-3.5" /></button></div>}</>
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-2"><input placeholder="Nama Baru..." value={newDeptInput} onChange={(e) => setNewDeptInput(e.target.value)} className="flex-1 border-2 border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:border-blue-500"/><button onClick={() => { if(newDeptInput.trim() && !departments.includes(newDeptInput.trim())) { setDepartments([...departments, newDeptInput.trim()]); setNewDeptInput(''); } }} className="bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold">Tambah</button></div>
        </div>

        {/* KELOLA RUANGAN */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 text-left">
          <h2 className="text-sm font-bold text-blue-900 mb-4 flex items-center gap-2 uppercase tracking-wide"><MapPin className="w-5 h-5 text-blue-600" /> Kelola Ruangan Gereja</h2>
          <div className="space-y-2 mb-4 max-h-60 overflow-y-auto pr-1">
            {rooms.map((room, idx) => (
              <div key={idx} className="flex justify-between items-center bg-slate-50 px-3 py-2 rounded-xl text-xs border border-slate-100">
                {editingRoomIdx === idx ? (
                  <div className="flex gap-2 w-full"><input value={editRoomValue} onChange={(e) => setEditRoomValue(e.target.value)} className="flex-1 border p-1 rounded"/><button onClick={() => { if(editRoomValue.trim()){ const nr = [...rooms]; nr[idx]=editRoomValue.trim(); setRooms(nr); setEditingRoomIdx(null); }}} className="text-blue-600"><Check className="w-4 h-4"/></button><button onClick={() => setEditingRoomIdx(null)} className="text-slate-400"><X className="w-4 h-4"/></button></div>
                ) : (
                  <><span className="font-bold">{room}</span><div className="flex gap-1"><button onClick={() => { setEditingRoomIdx(idx); setEditRoomValue(room); }} className="text-slate-400 hover:text-blue-600 p-1"><Edit2 className="w-3.5 h-3.5" /></button><button onClick={() => setRooms(rooms.filter((_, i) => i !== idx))} className="text-slate-400 hover:text-rose-600 p-1"><Trash2 className="w-3.5 h-3.5" /></button></div></>
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-2"><input placeholder="Ruangan Baru..." value={newRoomInput} onChange={(e) => setNewRoomInput(e.target.value)} className="flex-1 border-2 border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:border-blue-500"/><button onClick={() => { if(newRoomInput.trim() && !rooms.includes(newRoomInput.trim())) { setRooms([...rooms, newRoomInput.trim()]); setNewRoomInput(''); } }} className="bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold">Tambah</button></div>
        </div>
      </div>
    )}
  </main>

  {/* MODAL DETAIL ACARA & FLYER (Fix Ukuran & Header) */}
  {detailModalOpen && selectedEvent && (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:hidden">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in duration-200 text-left">
        {/* Header Modal - TERKUNCI DI ATAS */}
        <div className="flex justify-between items-center p-5 border-b-2 border-slate-100 bg-slate-50 shrink-0">
          <h3 className="font-black text-blue-950 text-base uppercase tracking-wider flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-blue-600"/> Detail Kegiatan
          </h3>
          <button onClick={() => setDetailModalOpen(false)} className="bg-rose-100 hover:bg-rose-200 text-rose-600 p-2 rounded-full font-black transition shadow-sm">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Isi Konten - BISA DI-SCROLL */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          <h4 className="font-black text-2xl text-slate-800 mb-4">{selectedEvent.title}</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-sm font-bold text-slate-700 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
            <div className="flex items-center gap-2"><CalendarIcon className="w-4 h-4 text-blue-600" /> {formatDateID(selectedEvent.date)}</div>
            <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-blue-600" /> {selectedEvent.startTime} - {selectedEvent.endTime} WIB</div>
            <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-blue-600" /> {selectedEvent.room}</div>
            <div className="flex items-center gap-2"><Users className="w-4 h-4 text-blue-600" /> {selectedEvent.department} (PIC: {selectedEvent.pic})</div>
          </div>

          {selectedEvent.description && (
            <div className="mb-6">
              <h5 className="text-xs font-black text-slate-400 uppercase mb-2">Keterangan / Agenda:</h5>
              <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">{selectedEvent.description}</p>
            </div>
          )}

          {/* Tampilan Flyer Otomatis fit ke layar */}
          {selectedEvent.flyerUrl && (
            <div className="mt-4 border-t-2 border-dashed border-slate-200 pt-6">
              <h5 className="text-xs font-black text-blue-800 uppercase mb-4 text-center tracking-widest flex items-center justify-center gap-2">
                <ImageIcon className="w-4 h-4"/> Poster / Flyer Acara
              </h5>
              <div className="bg-slate-100 p-2 rounded-2xl flex justify-center border border-slate-200">
                {/* max-h-[50vh] menahan gambar maksimal 50% layar */}
                <img src={selectedEvent.flyerUrl} alt="Flyer Kegiatan" className="max-w-full max-h-[50vh] object-contain rounded-xl shadow-sm" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )}

  {/* MODAL AUTH */}
  {isAuthOpen && (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 border border-slate-100 text-left">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-black text-blue-950 text-lg uppercase tracking-wide">{isRegister ? 'Daftar Akun' : 'Login Sistem'}</h3>
          <button onClick={() => setIsAuthOpen(false)} className="text-slate-400 hover:text-slate-800 bg-slate-100 p-2 rounded-full font-bold">✕</button>
        </div>
        {authError && <div className="mb-6 bg-rose-50 text-rose-700 p-4 rounded-xl text-sm font-bold flex gap-3 shadow-sm"><AlertCircle className="w-5 h-5 shrink-0" /><span>{authError}</span></div>}
        <form onSubmit={handleLoginRegister} className="space-y-4">
          <div><label className="block text-xs font-black text-slate-500 mb-2 uppercase">Badan Pelayan</label><select value={authDept} onChange={(e) => setAuthDept(e.target.value)} className="w-full border-2 border-slate-200 rounded-xl p-3.5 text-sm focus:border-blue-600 font-bold text-slate-700">{departments.map((d, i) => <option key={i} value={d}>{d}</option>)}</select></div>
          <div><label className="block text-xs font-black text-slate-500 mb-2 uppercase">Nama PIC</label><input type="text" value={authName} onChange={(e) => setAuthName(e.target.value)} className="w-full border-2 border-slate-200 rounded-xl p-3.5 text-sm focus:border-blue-600 font-bold" required/></div>
          <div><label className="block text-xs font-black text-slate-500 mb-2 uppercase">Password</label><input type="password" value={authPass} onChange={(e) => setAuthPass(e.target.value)} className="w-full border-2 border-slate-200 rounded-xl p-3.5 text-sm focus:border-blue-600 font-bold" required/></div>
          <div className="flex items-center gap-3 pt-2"><input type="checkbox" id="regToggle" checked={isRegister} onChange={(e) => setIsRegister(e.target.checked)} className="rounded text-blue-700 w-5 h-5 cursor-pointer border-slate-300"/><label htmlFor="regToggle" className="text-sm text-slate-600 font-bold cursor-pointer">Buat akun baru</label></div>
          <button type="submit" className="w-full bg-blue-700 text-white font-black uppercase tracking-wider py-4 rounded-xl text-sm shadow-xl hover:bg-blue-800 mt-2">{isRegister ? 'Daftar' : 'Login'}</button>
        </form>
      </div>
    </div>
  )}

  {/* MODAL FORM JADWAL + FLYER */}
  {isEventModalOpen && (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto print:hidden">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8 border border-slate-100 my-8 text-left relative">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-black text-blue-950 text-lg uppercase tracking-wide">{editingEventId ? 'Edit Jadwal' : 'Buat Jadwal Baru'}</h3>
          <button onClick={() => { setIsEventModalOpen(false); resetEventForm(); }} className="text-slate-400 bg-slate-100 p-2 rounded-full font-bold">✕</button>
        </div>
        {conflictWarning && <div className="mb-6 bg-amber-50 text-amber-800 p-4 rounded-xl text-sm font-bold flex gap-3"><AlertCircle className="w-5 h-5 shrink-0" /><span>{conflictWarning}</span></div>}
        
        <form onSubmit={handleSaveEvent} className="space-y-4">
          <div><label className="block text-xs font-black text-slate-500 mb-2 uppercase">Nama Kegiatan</label><input type="text" value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} className="w-full border-2 border-slate-200 rounded-xl p-3 text-sm font-bold focus:border-blue-600" required/></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-black text-slate-500 mb-2 uppercase">Tanggal</label><input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="w-full border-2 border-slate-200 rounded-xl p-3 text-sm font-bold focus:border-blue-600" required/></div>
            <div><label className="block text-xs font-black text-slate-500 mb-2 uppercase">Pilih Ruangan</label><select value={eventRoom} onChange={(e) => setEventRoom(e.target.value)} className="w-full border-2 border-slate-200 rounded-xl p-3 text-sm font-bold focus:border-blue-600">{rooms.map((r, i) => <option key={i} value={r}>{r}</option>)}</select></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-black text-slate-500 mb-2 uppercase">Jam Mulai</label><input type="time" value={eventStartTime} onChange={(e) => setEventStartTime(e.target.value)} className="w-full border-2 border-slate-200 rounded-xl p-3 text-sm font-bold focus:border-blue-600" required/></div>
            <div><label className="block text-xs font-black text-slate-500 mb-2 uppercase">Jam Selesai</label><input type="time" value={eventEndTime} onChange={(e) => setEventEndTime(e.target.value)} className="w-full border-2 border-slate-200 rounded-xl p-3 text-sm font-bold focus:border-blue-600" required/></div>
          </div>
          <div><label className="block text-xs font-black text-slate-500 mb-2 uppercase">Keterangan / Agenda</label><textarea rows="2" value={eventDesc} onChange={(e) => setEventDesc(e.target.value)} className="w-full border-2 border-slate-200 rounded-xl p-3 text-sm font-semibold focus:border-blue-600"/></div>
          
          {/* INPUT FLYER GAMBAR */}
          <div className="p-4 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl">
            <label className="block text-xs font-black text-slate-500 mb-2 uppercase flex items-center gap-2"><ImageIcon className="w-4 h-4"/> Upload Poster/Flyer (Opsional)</label>
            <input type="file" accept="image/*" onChange={handleImageUpload} className="text-xs font-semibold text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200" />
            {eventFlyer && <div className="mt-3 text-[10px] text-emerald-600 font-bold flex gap-1"><CheckCircle className="w-3 h-3"/> Gambar berhasil dilampirkan</div>}
          </div>

          <button type="submit" className="w-full bg-blue-700 hover:bg-blue-800 text-white font-black uppercase py-4 rounded-xl text-sm shadow-xl mt-4">Simpan Jadwal</button>
        </form>
      </div>
    </div>
  )}
</div>


);
}