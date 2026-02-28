import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  Home, CalendarDays, Users, Wallet, LogOut, CheckCircle2, 
  Circle, ChevronRight, ShieldCheck, Bell, Eye, 
  ShieldAlert, ClipboardCheck, Clock, CheckCircle, ExternalLink,
  Smartphone, MapPin, Briefcase, RefreshCw, TrendingUp, DollarSign,
  AlertTriangle, X, Info, Filter, Calendar, Search, ArrowUpRight,
  User, Hash, MessageCircle, Globe, Tag, FileText, MapPinned, Stethoscope,
  History, Image as ImageIcon, AlignLeft, ReceiptText, Layers, Copy, Check,
  Sparkles, FileDown, Download, UserPlus, Save, Plus, Upload, Loader2,
  ChevronDown, SearchCode
} from 'lucide-react';

// --- CONFIGURATION SUPABASE ---
const SUPABASE_CONFIG = {
  url: 'https://gkyojapzrnfufbvtwbdu.supabase.co',
  anonKey: 'sb_publishable_UEJxY6IEv3-d41OdcdAwhw_-QZWkczZ'
};

const PACKAGES_INFO = {
  1: { name: "Paket 1", price: 50000 },
  2: { name: "Paket 2", price: 100000 },
  3: { name: "Paket 3", price: 150000 }
};
const DESIGN_FEE = 20000;

const generateTasksByPackage = (packageId) => {
  let dynamicTasks = [];
  const pkg = Number(packageId);
  
  if (pkg === 1) {
    dynamicTasks = [
      { id: 'p1', label: "Post Instagram", completed: false },
      { id: 's1', label: "Story Instagram", completed: false }
    ];
  } else if (pkg === 2) {
    dynamicTasks = [
      { id: 'p1', label: "Post Instagram (3x)", completed: false },
      { id: 'p2', label: "Post Facebook (3x)", completed: false },
      { id: 's1', label: "Story Instagram", completed: false },
      { id: 's2', label: "Story Facebook", completed: false }
    ];
  } else if (pkg === 3) {
    dynamicTasks = [
      { id: 'p1', label: "Post Instagram (4x)", completed: false },
      { id: 'p2', label: "Post Facebook (4x)", completed: false },
      { id: 's1', label: "Story Instagram (3x)", completed: false },
      { id: 's2', label: "Story Facebook (3x)", completed: false }
    ];
  }
  
  return dynamicTasks;
};

const formatJadwalTayang = (isoString) => {
  if (!isoString) return 'Belum diatur';
  try {
    const date = new Date(isoString);
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const dayName = days[date.getDay()];
    const d = date.getDate();
    const m = date.getMonth() + 1;
    const y = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const mins = String(date.getMinutes()).padStart(2, '0');
    
    return `${dayName}, ${d}-${m}-${y} | ${hours}:${mins}`;
  } catch (e) {
    return isoString;
  }
};

const App = () => {
  const [supabase, setSupabase] = useState(null);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  const [authData, setAuthData] = useState({ username: '', password: '' });
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [reviewClientId, setReviewClientId] = useState(null); 
  const [financeClientId, setFinanceClientId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadingState, setUploadingState] = useState({ type: null, index: null });
  const [notification, setNotification] = useState(null);
  
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth());
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());

  // Form State for new client
  const [newClient, setNewClient] = useState({
    nama_klien: '',
    paket: '1',
    jasa_desain: false,
    whatsapp: '',
    alamat_kantor: '',
    posisi: '',
    penempatan: '',
    jadwal_tayang: '',
    caption: '',
    materi_urls: [],
    bukti_transfer_url: ''
  });

  const lockFetchRef = useRef(false);

  useEffect(() => {
    const loadScripts = async () => {
      const scripts = [
        'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
        'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.23/jspdf.plugin.autotable.min.js'
      ];
      for (const src of scripts) {
        if (!document.querySelector(`script[src="${src}"]`)) {
          const script = document.createElement('script');
          script.src = src;
          script.async = false;
          document.body.appendChild(script);
        }
      }
    };
    loadScripts();
  }, []);

  useEffect(() => {
    const init = () => {
      if (window.supabase) {
        const client = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
        setSupabase(client);
      }
    };
    if (!window.supabase) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
      script.async = true;
      script.onload = init;
      document.body.appendChild(script);
    } else {
      init();
    }
  }, []);

  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleFileUpload = async (event, bucket, type, index = null) => {
    const file = event.target.files[0];
    if (!file || !supabase) return;

    setUploadingState({ type, index });
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      if (type === 'materi') {
        const updatedUrls = [...newClient.materi_urls];
        if (index !== null) {
          updatedUrls[index] = publicUrl;
        } else {
          updatedUrls.push(publicUrl);
        }
        setNewClient(prev => ({ ...prev, materi_urls: updatedUrls }));
      } else if (type === 'bukti') {
        setNewClient(prev => ({ ...prev, bukti_transfer_url: publicUrl }));
      }

      showToast("File berhasil diunggah!");
    } catch (err) {
      console.error(err);
      showToast("Gagal unggah file: " + err.message, "error");
    } finally {
      setUploadingState({ type: null, index: null });
    }
  };

  const fetchData = useCallback(async (force = false) => {
    if (!supabase || (lockFetchRef.current && !force)) return;
    if (force) setIsLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('data_klien')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      if (data) {
        const normalizedData = data.map(item => {
          let allMateriUrls = [];
          try {
            if (item.materi_urls) {
              const rawUrls = Array.isArray(item.materi_urls) ? item.materi_urls : [item.materi_urls];
              allMateriUrls = rawUrls.map(u => {
                if (typeof u === 'object' && u !== null) return u.url || u.link || null;
                return typeof u === 'string' ? u : null;
              }).filter(url => url !== null);
            }
          } catch (e) {
            console.error("Error parsing multipost URLs", e);
          }

          return {
            ...item,
            id: item.id,
            name: item.nama_klien,
            package: item.paket,
            designService: item.jasa_desain,
            tasks: Array.isArray(item.checklist_data) ? item.checklist_data : [],
            status_admin: item.status_admin || 'pending',
            created_at: item.created_at,
            kategori: item.kategori,
            no_wa: item.whatsapp,
            bukti_transfer_url: item.bukti_transfer_url,
            alamat_kantor: item.alamat_kantor,
            posisi: item.posisi,
            penempatan: item.penempatan,
            jadwal_tayang: item.jadwal_tayang,
            materi_iklan_list: allMateriUrls,
            caption: item.caption
          };
        });
        setClients(normalizedData);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    if (!supabase || !user) return;

    fetchData(true);

    const channel = supabase
      .channel('data_klien_changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'data_klien' },
        (payload) => {
          showToast(`Ada Iklan Masuk: ${payload.new.nama_klien}!`, 'success');
          try {
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
            audio.play().catch(e => console.log("Audio play blocked"));
          } catch(e) {}
          fetchData(false);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'data_klien' },
        (payload) => {
          fetchData(false);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, user, fetchData]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (authData.username.toLowerCase() === 'admin' && authData.password === 'admin123') {
      setUser({ role: 'Admin', name: 'Admin LokerMjl' });
    } else {
      showToast("Akses ditolak!", "error");
    }
  };

  const calculatePrice = (pkgId, design) => (PACKAGES_INFO[pkgId]?.price || 0) + (design ? DESIGN_FEE : 0);

  const approveOrder = async (id, pkgId) => {
    if (!supabase) return;
    setIsLoading(true);
    const tasks = generateTasksByPackage(pkgId);
    try {
      const { error } = await supabase.from('data_klien').update({ status_admin: 'approved', checklist_data: tasks }).eq('id', id);
      if (error) throw error;
      showToast("Pembayaran diverifikasi!");
      setReviewClientId(null); 
      fetchData(true);
    } catch (err) {
      showToast("Gagal update database!", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTask = async (clientId, taskId) => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;
    const newTasks = client.tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t);
    try {
      const { error } = await supabase.from('data_klien').update({ checklist_data: newTasks }).eq('id', clientId);
      if (error) throw error;
      setClients(prev => prev.map(c => c.id === clientId ? { ...c, tasks: newTasks } : c));
    } catch (err) {
      showToast("Gagal update tugas!", "error");
    }
  };

  const handleAddClient = async (e) => {
    e.preventDefault();
    if (!supabase) return;
    setIsLoading(true);

    try {
      const { error } = await supabase.from('data_klien').insert([{
        ...newClient,
        status_admin: 'pending',
        created_at: new Date().toISOString()
      }]);

      if (error) throw error;
      
      showToast("Klien baru berhasil ditambahkan!");
      setShowAddModal(false);
      setNewClient({
        nama_klien: '',
        paket: '1',
        jasa_desain: false,
        whatsapp: '',
        alamat_kantor: '',
        posisi: '',
        penempatan: '',
        jadwal_tayang: '',
        caption: '',
        materi_urls: [],
        bukti_transfer_url: ''
      });
      fetchData(true);
    } catch (err) {
      showToast("Gagal menambah klien!", "error");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const isAllTasksDone = (tasks) => tasks && tasks.length > 0 && tasks.every(t => t.completed);

  const filteredClients = useMemo(() => {
    return clients.filter(c => {
      const date = new Date(c.created_at);
      return date.getMonth() === Number(filterMonth) && date.getFullYear() === Number(filterYear);
    });
  }, [clients, filterMonth, filterYear]);

  const pendingOrders = useMemo(() => filteredClients.filter(c => c.status_admin === 'pending'), [filteredClients]);
  const approvedOrders = useMemo(() => filteredClients.filter(c => c.status_admin === 'approved'), [filteredClients]);
  
  const statsCompleted = useMemo(() => approvedOrders.filter(c => isAllTasksDone(c.tasks)).length, [approvedOrders]);
  const statsOngoing = useMemo(() => approvedOrders.filter(c => !isAllTasksDone(c.tasks)).length, [approvedOrders]);

  const approvedClientsSorted = useMemo(() => {
    return [...approvedOrders].sort((a, b) => {
      const aDone = isAllTasksDone(a.tasks);
      const bDone = isAllTasksDone(b.tasks);
      if (aDone === bDone) return 0;
      return aDone ? 1 : -1;
    });
  }, [approvedOrders]);

  const totalOmzet = useMemo(() => 
    approvedClientsSorted.reduce((acc, c) => acc + calculatePrice(c.package, c.designService), 0)
  , [approvedClientsSorted]);

  const selectedClient = clients.find(c => c.id === selectedClientId);
  const reviewClient = clients.find(c => c.id === reviewClientId);
  const financeClient = clients.find(c => c.id === financeClientId);
  const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

  const handleExportPDF = async () => {
    if (!window.jspdf) {
      showToast("Library PDF belum siap", "error");
      return;
    }
    
    setIsLoading(true);
    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      const monthLabel = monthNames[filterMonth];
      const yearLabel = filterYear;

      doc.setFontSize(22);
      doc.setTextColor(67, 56, 202); 
      doc.text("LOKERMAJALENGKA", 14, 22);
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139); 
      doc.text("LAPORAN FINANCE OPERASIONAL", 14, 28);
      
      doc.setFontSize(14);
      doc.setTextColor(15, 23, 42); 
      doc.text(`Periode: ${monthLabel} ${yearLabel}`, 14, 45);

      const summaryData = [
        ["Total Transaksi", `${approvedOrders.length} Iklan`],
        ["Paket 1 Terjual", `${approvedOrders.filter(c => Number(c.package) === 1).length}`],
        ["Paket 2 Terjual", `${approvedOrders.filter(c => Number(c.package) === 2).length}`],
        ["Paket 3 Terjual", `${approvedOrders.filter(c => Number(c.package) === 3).length}`],
        ["TOTAL OMZET", `Rp ${totalOmzet.toLocaleString('id-ID')}`]
      ];

      doc.autoTable({
        startY: 50,
        head: [['Ringkasan', 'Nilai']],
        body: summaryData,
        theme: 'grid',
        headStyles: { fillColor: [67, 56, 202], textColor: 255 },
        columnStyles: { 0: { fontStyle: 'bold' }, 1: { halign: 'right' } }
      });

      const tableData = approvedOrders.map((c, index) => [
        index + 1,
        new Date(c.created_at).toLocaleDateString('id-ID'),
        c.name,
        `Paket ${c.package}`,
        c.designService ? 'Ya' : 'Tidak',
        `Rp ${calculatePrice(c.package, c.designService).toLocaleString('id-ID')}`
      ]);

      doc.autoTable({
        startY: doc.lastAutoTable.finalY + 15,
        head: [['No', 'Tanggal', 'Nama Klien', 'Paket', 'Desain', 'Jumlah']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [51, 65, 85] },
        columnStyles: { 5: { halign: 'right' } }
      });

      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184);
      doc.text(`Generated at: ${new Date().toLocaleString('id-ID')}`, 14, doc.internal.pageSize.height - 10);

      doc.save(`Laporan_Finance_${monthLabel}_${yearLabel}.pdf`);
      showToast("PDF Berhasil diunduh!");
    } catch (err) {
      console.error(err);
      showToast("Gagal export PDF", "error");
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 font-sans">
        <div className="w-full max-w-sm bg-white rounded-3xl p-10 shadow-2xl shadow-indigo-100 text-center border border-indigo-50">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-indigo-200">
            <ShieldCheck size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-black italic mb-1 text-slate-900 tracking-tight">LOKERMAJALENGKA</h1>
          <p className="text-indigo-500 text-[9px] font-bold uppercase mb-10 tracking-[0.2em]">OPERATIONS SYSTEM</p>
          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div className="space-y-2">
               <label className="text-[10px] font-medium text-slate-400 uppercase ml-2 tracking-widest">Administrator</label>
               <input type="text" placeholder="Username" className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 font-medium transition-all text-sm" onChange={e => setAuthData({...authData, username: e.target.value})} />
            </div>
            <div className="space-y-2">
               <label className="text-[10px] font-medium text-slate-400 uppercase ml-2 tracking-widest">Access Key</label>
               <input type="password" placeholder="••••••••" className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 font-medium transition-all text-sm" onChange={e => setAuthData({...authData, password: e.target.value})} />
            </div>
            <button className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 active:scale-95 transition-all mt-6">Authorize Entry</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex justify-center font-sans antialiased text-slate-900">
      <div className="w-full max-w-md bg-white h-screen shadow-2xl relative flex flex-col overflow-hidden">
        
        {notification && (
          <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[1000] w-[90%] max-w-xs p-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top duration-300 ${notification.type === 'error' ? 'bg-red-600 text-white' : 'bg-indigo-600 text-white border border-white/20'}`}>
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
              {notification.type === 'error' ? <AlertTriangle size={16}/> : <Sparkles size={16}/>}
            </div>
            <p className="text-[11px] font-bold uppercase tracking-tight flex-1">{notification.message}</p>
            <button onClick={() => setNotification(null)} className="opacity-50 hover:opacity-100"><X size={16}/></button>
          </div>
        )}

        <header className="px-6 pt-10 pb-6 flex justify-between items-center bg-white/95 backdrop-blur-md sticky top-0 z-40 shrink-0">
          <div className="flex flex-col">
            <h1 className="text-[20px] font-black italic tracking-tighter text-indigo-700 leading-none">LOKERMAJALENGKA</h1>
            <p className="text-[9px] font-bold text-slate-400 tracking-[0.25em] mt-1 uppercase">OPERATIONS SYSTEM</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-full">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Realtime</span>
            </div>
            <button 
              onClick={() => fetchData(true)} 
              className={`w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 border border-indigo-100 transition-all shadow-sm ${isLoading ? 'animate-spin' : 'active:scale-90 hover:bg-indigo-100'}`}
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </header>

        {(activeTab === 'tasklist' || activeTab === 'finance' || activeTab === 'approval') && (
          <div className="px-8 mb-4 animate-in fade-in shrink-0">
             <div className="bg-slate-50 rounded-2xl p-3 flex gap-3 items-center border border-slate-100">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm text-indigo-600">
                  <Calendar size={16} />
                </div>
                <div className="flex-1 flex gap-2">
                  <select 
                    className="bg-transparent text-[10px] font-bold uppercase tracking-wider outline-none cursor-pointer flex-1"
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(e.target.value)}
                  >
                    {monthNames.map((m, i) => <option key={i} value={i}>{m}</option>)}
                  </select>
                  <select 
                    className="bg-transparent text-[10px] font-bold uppercase tracking-wider outline-none cursor-pointer"
                    value={filterYear}
                    onChange={(e) => setFilterYear(e.target.value)}
                  >
                    {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
             </div>
          </div>
        )}

        <main className="flex-1 px-8 overflow-y-auto pt-2 pb-32 no-scrollbar">
          {activeTab === 'home' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-indigo-600 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-indigo-100 relative overflow-hidden group">
                <div className="relative z-10">
                  <p className="text-indigo-200 text-[10px] font-bold uppercase tracking-[0.3em] mb-4">Omzet {monthNames[filterMonth]}</p>
                  <h2 className="text-3xl font-black tracking-tighter mb-8 flex items-center gap-2">
                    Rp {totalOmzet.toLocaleString('id-ID')}
                    <ArrowUpRight size={18} className="text-indigo-300" />
                  </h2>
                  <div className="flex gap-3">
                     <div className="bg-white/10 backdrop-blur-md rounded-xl py-3 px-5 flex-1 border border-white/10">
                        <p className="text-[8px] font-medium text-indigo-200 uppercase mb-1">Iklan Selesai</p>
                        <p className="text-lg font-black">{statsCompleted}</p>
                     </div>
                     <div className="bg-white/10 backdrop-blur-md rounded-xl py-3 px-5 flex-1 border border-white/10">
                        <p className="text-[8px] font-medium text-indigo-200 uppercase mb-1">Iklan Berjalan</p>
                        <p className="text-lg font-black">{statsOngoing}</p>
                     </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">Menu Navigasi</p>
                <div className="grid grid-cols-2 gap-3">
                   <div onClick={() => setActiveTab('approval')} className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm hover:border-indigo-500 transition-all cursor-pointer group relative">
                      {pendingOrders.length > 0 && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-bounce shadow-lg ring-2 ring-white">
                          {pendingOrders.length}
                        </div>
                      )}
                      <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                        <ShieldAlert size={20} />
                      </div>
                      <p className="text-xs font-bold text-slate-900 mb-0.5">Approval</p>
                      <p className="text-[9px] font-medium text-slate-400 uppercase tracking-tight">{pendingOrders.length} Menunggu</p>
                   </div>
                   <div onClick={() => setActiveTab('tasklist')} className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm hover:border-indigo-500 transition-all cursor-pointer group">
                      <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                        <CalendarDays size={20} />
                      </div>
                      <p className="text-xs font-bold text-slate-900 mb-0.5">Task List</p>
                      <p className="text-[9px] font-medium text-slate-400 uppercase tracking-tight">Cek Progress</p>
                   </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'approval' && (
            <div className="space-y-8 animate-in fade-in duration-500 pb-10">
              <div className="grid grid-cols-2 gap-3 px-2">
                 <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl">
                    <p className="text-[8px] font-black text-amber-600 uppercase tracking-widest mb-1">Menunggu</p>
                    <p className="text-xl font-black text-slate-900">{pendingOrders.length}</p>
                 </div>
                 <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl">
                    <p className="text-[8px] font-black text-indigo-600 uppercase tracking-widest mb-1">Approved</p>
                    <p className="text-xl font-black text-slate-900">{approvedOrders.length}</p>
                 </div>
              </div>

              <div className="px-2">
                 <button 
                  onClick={() => setShowAddModal(true)}
                  className="w-full py-4 rounded-2xl bg-slate-900 text-white flex items-center justify-center gap-3 shadow-xl active:scale-[0.98] transition-all"
                 >
                   <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
                     <Plus size={16} />
                   </div>
                   <span className="text-[11px] font-black uppercase tracking-widest">Tambah Klien Baru</span>
                 </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between px-2 mb-2">
                  <h3 className="text-sm font-black tracking-tight text-slate-900 uppercase tracking-widest">Antrean Approval</h3>
                </div>
                
                {pendingOrders.length === 0 ? (
                  <div className="py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200 text-center">
                    <p className="text-slate-300 font-bold text-[10px] uppercase tracking-widest">Tidak ada antrean</p>
                  </div>
                ) : pendingOrders.map(c => (
                  <div 
                    key={c.id} 
                    onClick={() => setReviewClientId(c.id)}
                    className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex items-center justify-between group active:scale-[0.98] transition-all cursor-pointer hover:border-amber-400"
                  >
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center text-lg font-black border border-amber-100">
                          {c.name?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-slate-900 leading-tight">{c.name}</p>
                          <p className="text-[9px] text-slate-400 font-medium uppercase tracking-wider mt-1">Paket {c.package} • {new Date(c.created_at).toLocaleDateString('id-ID', {day:'2-digit', month:'short'})}</p>
                        </div>
                     </div>
                     <ChevronRight size={18} className="text-slate-300 group-hover:text-amber-600 transition-colors" />
                  </div>
                ))}
              </div>

              <div className="space-y-4 pt-4">
                 <div className="flex items-center gap-2 px-2">
                    <History size={16} className="text-slate-400" />
                    <h3 className="text-sm font-black tracking-tight text-slate-400 uppercase tracking-widest">Riwayat Approval</h3>
                 </div>
                 <div className="space-y-2">
                    {approvedOrders.length === 0 ? (
                       <p className="text-[10px] text-slate-300 italic px-2">Belum ada riwayat</p>
                    ) : approvedOrders.slice(0, 5).map(c => (
                      <div key={c.id} onClick={() => setReviewClientId(c.id)} className="bg-slate-50/50 border border-slate-100 rounded-xl p-3 flex items-center justify-between cursor-pointer opacity-70 hover:opacity-100 transition-all">
                         <div className="flex items-center gap-3">
                            <CheckCircle2 size={16} className="text-emerald-500" />
                            <p className="text-xs font-bold text-slate-600">{c.name}</p>
                         </div>
                         <p className="text-[9px] font-medium text-slate-400 uppercase">{new Date(c.created_at).toLocaleDateString('id-ID', {day:'2-digit', month:'short'})}</p>
                      </div>
                    ))}
                 </div>
              </div>
            </div>
          )}

          {activeTab === 'tasklist' && (
            <div className="space-y-8 animate-in fade-in duration-500 pb-10">
              <div className="space-y-4">
                 <div className="flex justify-between items-center px-2 mb-1">
                    <h3 className="text-sm font-black tracking-widest uppercase text-slate-900">Iklan Berjalan</h3>
                 </div>
                 <div className="space-y-3">
                    {approvedClientsSorted.filter(c => !isAllTasksDone(c.tasks)).length === 0 ? (
                      <div className="py-10 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                         <p className="text-slate-300 font-bold text-[9px] uppercase tracking-widest">Tidak ada iklan aktif</p>
                      </div>
                    ) : approvedClientsSorted.filter(c => !isAllTasksDone(c.tasks)).map(c => {
                      const progress = c.tasks.length > 0 ? Math.round((c.tasks.filter(t => t.completed).length / c.tasks.length) * 100) : 0;
                      return (
                        <div key={c.id} onClick={() => setSelectedClientId(c.id)} className="p-4 rounded-2xl border bg-white border-slate-100 hover:border-indigo-500 shadow-sm transition-all cursor-pointer flex items-center justify-between active:scale-[0.98]">
                          <div className="flex items-center gap-3 flex-1">
                             <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-indigo-50 text-indigo-600"><Clock size={20} /></div>
                             <div className="flex-1 pr-4">
                               <p className="font-bold text-sm text-slate-900">{c.name}</p>
                               <div className="flex items-center gap-2 mt-1.5">
                                 <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                                   <div className="h-full bg-indigo-600 transition-all duration-700" style={{width: `${progress}%`}}></div>
                                 </div>
                                 <p className="text-[8px] font-bold text-slate-400 uppercase min-w-[30px] text-right">{progress}%</p>
                               </div>
                             </div>
                          </div>
                          <ChevronRight size={14} className="text-slate-300" />
                        </div>
                      );
                    })}
                 </div>
              </div>

              <div className="space-y-4 pt-4">
                 <div className="flex items-center gap-2 px-2">
                    <History size={16} className="text-slate-400" />
                    <h3 className="text-sm font-black tracking-tight text-slate-400 uppercase tracking-widest">Riwayat Selesai (Klik Edit)</h3>
                 </div>
                 <div className="space-y-2">
                    {approvedClientsSorted.filter(c => isAllTasksDone(c.tasks)).length === 0 ? (
                       <p className="text-[10px] text-slate-300 italic px-2">Belum ada iklan selesai</p>
                    ) : approvedClientsSorted.filter(c => isAllTasksDone(c.tasks)).map(c => (
                      <div key={c.id} onClick={() => setSelectedClientId(c.id)} className="bg-slate-50/50 border border-slate-100 rounded-xl p-3 flex items-center justify-between opacity-80 hover:opacity-100 cursor-pointer transition-all">
                         <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                               <CheckCircle2 size={16} />
                            </div>
                            <div>
                               <p className="text-xs font-bold text-slate-600 leading-none mb-1">{c.name}</p>
                               <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Sudah Tayang</p>
                            </div>
                         </div>
                         <p className="text-[9px] font-medium text-slate-400 uppercase">{new Date(c.created_at).toLocaleDateString('id-ID', {day:'2-digit', month:'short'})}</p>
                      </div>
                    ))}
                 </div>
              </div>
            </div>
          )}

          {activeTab === 'finance' && (
            <div className="space-y-8 animate-in fade-in duration-500 pb-10">
               <div className="flex justify-between items-center px-2">
                   <h3 className="text-lg font-black tracking-tight">Finance Report</h3>
                   <button onClick={handleExportPDF} disabled={isLoading} className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-indigo-100 active:scale-95 transition-all disabled:opacity-50">
                     {isLoading ? <RefreshCw size={14} className="animate-spin" /> : <FileDown size={14} />}
                     Export PDF
                   </button>
                </div>

                <div className="bg-indigo-600 p-8 rounded-[2.5rem] shadow-xl shadow-indigo-100 text-center text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><Wallet size={120} /></div>
                    <div className="relative z-10">
                      <p className="text-indigo-200 text-[9px] font-bold uppercase tracking-[0.2em] mb-1">Total Pemasukan ({monthNames[filterMonth]})</p>
                      <h4 className="text-3xl font-black tracking-tighter mb-4">Rp {totalOmzet.toLocaleString('id-ID')}</h4>
                    </div>
                </div>

                <div className="space-y-4 pt-4">
                   <div className="flex items-center gap-2 px-2">
                      <History size={16} className="text-slate-400" />
                      <h3 className="text-sm font-black tracking-tight text-slate-900 uppercase tracking-widest">Riwayat Transaksi (Klik Bukti)</h3>
                   </div>
                   
                   <div className="space-y-2">
                      {approvedClientsSorted.length === 0 ? (
                         <div className="p-8 text-center text-slate-300 italic text-xs tracking-widest">Belum ada transaksi bulan ini</div>
                      ) : approvedClientsSorted.map(c => {
                        const price = calculatePrice(c.package, c.designService);
                        return (
                          <div key={c.id} onClick={() => setFinanceClientId(c.id)} className="bg-white border border-slate-100 rounded-xl p-3 flex items-center justify-between hover:border-indigo-400 transition-all cursor-pointer active:scale-95 shadow-sm">
                             <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                                   <ReceiptText size={16} />
                                </div>
                                <div>
                                   <p className="text-xs font-black text-slate-700 mb-0.5">{c.name}</p>
                                   <div className="flex items-center gap-1.5">
                                      <span className="text-[7px] font-black px-1 py-0.5 bg-indigo-100/50 text-indigo-600 rounded uppercase tracking-widest">P{c.package}</span>
                                      <span className="text-[8px] font-medium text-slate-400 uppercase">{new Date(c.created_at).toLocaleDateString('id-ID', {day:'2-digit', month:'short'})}</span>
                                   </div>
                                </div>
                             </div>
                             <div className="text-right">
                                <p className="text-xs font-black text-emerald-600 mb-0.5">+Rp {price.toLocaleString('id-ID')}</p>
                                <p className="text-[7px] font-black text-emerald-400 uppercase tracking-widest">Klik Bukti</p>
                             </div>
                          </div>
                        );
                      })}
                   </div>
                </div>
            </div>
          )}
        </main>

        <nav className="absolute bottom-0 w-full bg-white/80 backdrop-blur-2xl border-t border-slate-50 pt-5 pb-8 px-8 flex justify-between items-center z-50">
          <NavItem active={activeTab === 'home'} onClick={() => setActiveTab('home')} icon={<Home size={20}/>} label="Home" />
          <NavItem active={activeTab === 'approval'} onClick={() => setActiveTab('approval')} icon={<ShieldAlert size={20}/>} label="Approval" />
          <NavItem active={activeTab === 'tasklist'} onClick={() => setActiveTab('tasklist')} icon={<CalendarDays size={20}/>} label="Task List" />
          <NavItem active={activeTab === 'finance'} onClick={() => setActiveTab('finance')} icon={<Wallet size={20}/>} label="Finance" />
        </nav>

        {/* Modal: Add New Client */}
        {showAddModal && (
          <div className="fixed inset-0 z-[120] flex items-end justify-center p-0">
             <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShowAddModal(false)}></div>
             <div className="relative bg-white w-full max-w-md rounded-t-[3rem] p-8 shadow-2xl max-h-[95vh] flex flex-col animate-in slide-in-from-bottom duration-500 overflow-hidden">
                <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-8 shrink-0"></div>
                
                <div className="flex items-start justify-between mb-6 shrink-0">
                   <div>
                      <p className="text-indigo-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Administrator Tool</p>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tighter">Tambah Klien Baru</h3>
                   </div>
                   <button onClick={() => setShowAddModal(false)} className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 active:scale-90 transition-all"><X size={20}/></button>
                </div>

                <form onSubmit={handleAddClient} className="flex-1 overflow-y-auto no-scrollbar space-y-6 pb-6 px-1">
                   <div className="space-y-4 bg-slate-50 rounded-[2rem] p-6 border border-slate-100">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Perusahaan / Klien</label>
                        <input required type="text" placeholder="Contoh: PT. Maju Bersama" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none" value={newClient.nama_klien} onChange={(e) => setNewClient({...newClient, nama_klien: e.target.value})} />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pilih Paket</label>
                          <select className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none" value={newClient.paket} onChange={(e) => setNewClient({...newClient, paket: e.target.value})}>
                            <option value="1">Paket 1 (Rp 50rb)</option>
                            <option value="2">Paket 2 (Rp 100rb)</option>
                            <option value="3">Paket 3 (Rp 150rb)</option>
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Jasa Desain</label>
                          <div onClick={() => setNewClient({...newClient, jasa_desain: !newClient.jasa_desain})} className={`w-full h-[46px] border rounded-xl flex items-center justify-center cursor-pointer transition-all ${newClient.jasa_desain ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-400'}`}>
                            <span className="text-[10px] font-black uppercase tracking-widest">{newClient.jasa_desain ? 'Ya (+20rb)' : 'Tidak'}</span>
                          </div>
                        </div>
                      </div>
                   </div>

                   <div className="space-y-4">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Informasi Lowongan</p>
                      <div className="grid grid-cols-2 gap-3">
                        <input type="text" placeholder="Posisi" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none" value={newClient.posisi} onChange={e => setNewClient({...newClient, posisi: e.target.value})} />
                        <input type="text" placeholder="Penempatan" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none" value={newClient.penempatan} onChange={e => setNewClient({...newClient, penempatan: e.target.value})} />
                      </div>
                      <input type="text" placeholder="Alamat Lengkap Kantor" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none" value={newClient.alamat_kantor} onChange={e => setNewClient({...newClient, alamat_kantor: e.target.value})} />
                      <input type="text" placeholder="Nomor WhatsApp" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none" value={newClient.whatsapp} onChange={e => setNewClient({...newClient, whatsapp: e.target.value})} />
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Jadwal Tayang</label>
                        <input type="datetime-local" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none" value={newClient.jadwal_tayang} onChange={e => setNewClient({...newClient, jadwal_tayang: e.target.value})} />
                      </div>
                   </div>

                   <div className="space-y-4">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Materi Posting</p>
                      <div className="grid grid-cols-1 gap-3">
                         {newClient.materi_urls.map((url, idx) => (
                           <div key={idx} className="flex items-center gap-2 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
                              <ImageIcon size={16} className="text-indigo-600" />
                              <span className="flex-1 text-[10px] font-bold text-indigo-700 truncate">{url.split('/').pop()}</span>
                              <button type="button" onClick={() => setNewClient(prev => ({...prev, materi_urls: prev.materi_urls.filter((_, i) => i !== idx)}))} className="text-red-500"><X size={14}/></button>
                           </div>
                         ))}
                         <label className={`w-full border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all ${uploadingState.type === 'materi' ? 'bg-slate-50 border-slate-300' : 'hover:bg-indigo-50 border-slate-200 hover:border-indigo-400'}`}>
                            {uploadingState.type === 'materi' ? <Loader2 size={24} className="text-indigo-600 animate-spin mb-2" /> : <Upload size={24} className="text-slate-400 mb-2" />}
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{uploadingState.type === 'materi' ? 'Mengunggah...' : 'Pilih Materi Posting'}</span>
                            <input type="file" className="hidden" accept="image/*,video/*" onChange={(e) => handleFileUpload(e, 'materi-posting', 'materi')} disabled={uploadingState.type !== null} />
                         </label>
                      </div>
                   </div>

                   <div className="space-y-4">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Bukti Transfer</p>
                      {newClient.bukti_transfer_url ? (
                        <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-xl border border-emerald-100 mb-2">
                           <CheckCircle size={16} className="text-emerald-600" />
                           <span className="flex-1 text-[10px] font-bold text-emerald-700 truncate">Bukti berhasil diunggah</span>
                           <button type="button" onClick={() => setNewClient({...newClient, bukti_transfer_url: ''})} className="text-red-500"><X size={14}/></button>
                        </div>
                      ) : (
                        <label className={`w-full border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all ${uploadingState.type === 'bukti' ? 'bg-slate-50 border-slate-300' : 'hover:bg-emerald-50 border-slate-200 hover:border-emerald-400'}`}>
                           {uploadingState.type === 'bukti' ? <Loader2 size={24} className="text-emerald-600 animate-spin mb-2" /> : <Upload size={24} className="text-slate-400 mb-2" />}
                           <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{uploadingState.type === 'bukti' ? 'Mengunggah...' : 'Pilih Bukti Transfer'}</span>
                           <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'bukti-transfer', 'bukti')} disabled={uploadingState.type !== null} />
                        </label>
                      )}
                   </div>

                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Caption Iklan</label>
                      <textarea rows="4" placeholder="Tulis caption di sini..." className="w-full bg-slate-50 border border-slate-200 rounded-[1.5rem] px-4 py-4 text-xs font-medium outline-none resize-none" value={newClient.caption} onChange={e => setNewClient({...newClient, caption: e.target.value})}></textarea>
                   </div>

                   <div className="pt-4 shrink-0">
                      <button type="submit" disabled={isLoading || uploadingState.type !== null} className="w-full py-5 rounded-2xl bg-indigo-600 text-white font-black text-xs uppercase tracking-[0.2em] shadow-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50">
                         {isLoading ? <RefreshCw size={16} className="animate-spin" /> : <Save size={18} />}
                         Simpan Data Klien
                      </button>
                   </div>
                </form>
             </div>
          </div>
        )}

        {reviewClient && (
          <div className="fixed inset-0 z-[110] flex items-end justify-center p-0">
             <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setReviewClientId(null)}></div>
             <div className="relative bg-white w-full max-w-md rounded-t-[3rem] p-8 shadow-2xl max-h-[95vh] flex flex-col animate-in slide-in-from-bottom duration-500 overflow-hidden">
                <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-8 shrink-0"></div>
                
                <div className="flex items-start justify-between mb-6 shrink-0">
                   <div>
                      <p className="text-indigo-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Review Details</p>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tighter">{reviewClient.name}</h3>
                   </div>
                   <button onClick={() => setReviewClientId(null)} className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 active:scale-90 transition-all"><X size={20}/></button>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar space-y-8 pb-6">
                   <div className="grid grid-cols-2 gap-3">
                      <div className="bg-indigo-600 p-5 rounded-[1.5rem] shadow-lg shadow-indigo-100">
                         <p className="text-[8px] font-bold text-indigo-200 uppercase mb-1">Paket</p>
                         <p className="text-lg font-black text-white">Paket {reviewClient.package}</p>
                      </div>
                      <div className={`p-5 rounded-[1.5rem] shadow-lg ${reviewClient.status_admin === 'approved' ? 'bg-emerald-600' : 'bg-slate-900'}`}>
                         <p className="text-[8px] font-bold text-white/50 uppercase mb-1">Status</p>
                         <p className="text-lg font-black text-white uppercase tracking-tighter">{reviewClient.status_admin}</p>
                      </div>
                   </div>

                   <div className="space-y-3">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Detail Informasi</p>
                      <div className="bg-white border border-slate-100 rounded-[2rem] p-6 space-y-6 shadow-sm">
                         <DetailItem icon={<MapPinned size={16}/>} label="Alamat Kantor" value={reviewClient.alamat_kantor} />
                         <DetailItem icon={<MessageCircle size={16}/>} label="WhatsApp" value={reviewClient.no_wa} />
                         <DetailItem icon={<Briefcase size={16}/>} label="Posisi" value={reviewClient.posisi} />
                         <DetailItem icon={<MapPin size={16}/>} label="Penempatan" value={reviewClient.penempatan} />
                         <DetailItem icon={<Calendar size={16}/>} label="Jadwal Tayang" value={formatJadwalTayang(reviewClient.jadwal_tayang)} />
                         <DetailItem icon={<FileText size={16}/>} label="Jasa Desain" value={reviewClient.designService ? "Ya (+Rp 20.000)" : "Tidak"} />
                      </div>
                   </div>

                   <div className="space-y-4">
                      <div className="flex items-center justify-between px-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Materi Iklan</p>
                      </div>
                      <div className="bg-slate-50 border border-slate-100 rounded-[2rem] p-6 space-y-4">
                         {reviewClient.materi_iklan_list && reviewClient.materi_iklan_list.length > 0 ? (
                           reviewClient.materi_iklan_list.map((url, idx) => (
                             <div key={idx} className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-sm transition-all group">
                                <span className="text-[10px] font-bold text-slate-600 truncate flex-1">{url.split('/').pop()}</span>
                                <div className="flex items-center gap-2">
                                   <a href={url} target="_blank" rel="noreferrer" className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><ExternalLink size={14} /></a>
                                </div>
                             </div>
                           ))
                         ) : <p className="text-[10px] text-slate-400 italic">Tidak ada materi</p>}
                      </div>
                   </div>

                   <div className="space-y-4">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Bukti Transfer</p>
                      <div className="relative group overflow-hidden rounded-[2rem] border-4 border-slate-50 shadow-inner bg-slate-50">
                         {reviewClient.bukti_transfer_url ? (
                           <>
                             <img src={reviewClient.bukti_transfer_url} alt="Bukti Transfer" className="w-full h-56 object-contain p-2" />
                             <div className="absolute top-4 right-4 flex gap-2">
                                <a href={reviewClient.bukti_transfer_url} target="_blank" rel="noreferrer" className="w-10 h-10 bg-white text-slate-900 rounded-full flex items-center justify-center shadow-lg"><ExternalLink size={18} /></a>
                             </div>
                           </>
                         ) : <div className="w-full h-32 flex items-center justify-center"><p className="text-[10px] text-slate-300">Belum ada bukti</p></div>}
                      </div>
                   </div>
                </div>

                <div className="pt-6 shrink-0 flex flex-col gap-3 bg-white">
                   {reviewClient.status_admin === 'pending' ? (
                     <button onClick={() => approveOrder(reviewClient.id, reviewClient.package)} disabled={isLoading} className="w-full py-5 rounded-2xl bg-indigo-600 text-white font-black text-xs uppercase tracking-[0.2em] shadow-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50">
                       {isLoading ? <RefreshCw size={16} className="animate-spin" /> : <ShieldCheck size={18} />}
                       Approve & Generate Tasks
                     </button>
                   ) : <button onClick={() => setReviewClientId(null)} className="w-full py-5 rounded-2xl bg-slate-900 text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl active:scale-[0.98] transition-all shrink-0">Close Details</button>}
                </div>
             </div>
          </div>
        )}

        {/* Modal: Finance Detail & Bukti Transfer */}
        {financeClient && (
          <div className="fixed inset-0 z-[110] flex items-end justify-center p-0">
             <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setFinanceClientId(null)}></div>
             <div className="relative bg-white w-full max-w-md rounded-t-[3rem] p-8 shadow-2xl max-h-[90vh] flex flex-col animate-in slide-in-from-bottom duration-500 overflow-hidden">
                <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-8 shrink-0"></div>
                
                <div className="flex items-start justify-between mb-6 shrink-0">
                   <div>
                      <p className="text-emerald-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Transaction Verified</p>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tighter">Bukti Pembayaran</h3>
                      <p className="text-xs font-bold text-slate-400 mt-1">{financeClient.name}</p>
                   </div>
                   <button onClick={() => setFinanceClientId(null)} className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 active:scale-90 transition-all"><X size={20}/></button>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar space-y-6 pb-6">
                   <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex items-center justify-between">
                      <div>
                         <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Pemasukan</p>
                         <p className="text-2xl font-black text-emerald-600">Rp {calculatePrice(financeClient.package, financeClient.designService).toLocaleString('id-ID')}</p>
                      </div>
                      <div className="text-right">
                         <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Metode</p>
                         <p className="text-xs font-black text-slate-700">Transfer Bank</p>
                      </div>
                   </div>

                   <div className="space-y-4">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Lampiran Gambar</p>
                      <div className="relative rounded-[2rem] border-4 border-slate-50 bg-slate-100 overflow-hidden min-h-[300px] flex items-center justify-center">
                         {financeClient.bukti_transfer_url ? (
                           <>
                             <img src={financeClient.bukti_transfer_url} alt="Bukti Transfer" className="w-full h-full object-contain p-2" />
                             <a href={financeClient.bukti_transfer_url} target="_blank" rel="noreferrer" className="absolute bottom-4 right-4 w-12 h-12 bg-white/90 backdrop-blur shadow-xl rounded-full flex items-center justify-center text-indigo-600"><ExternalLink size={20} /></a>
                           </>
                         ) : <div className="text-center p-10"><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Tidak ada gambar bukti</p></div>}
                      </div>
                   </div>

                   <div className="bg-indigo-50/50 rounded-2xl p-5 border border-indigo-100/50">
                      <div className="flex items-center gap-3">
                         <Info size={16} className="text-indigo-600" />
                         <p className="text-[10px] font-bold text-indigo-700">Transaksi ini telah divalidasi oleh sistem pada {new Date(financeClient.created_at).toLocaleDateString('id-ID')}.</p>
                      </div>
                   </div>
                </div>

                <div className="pt-4 shrink-0">
                   <button onClick={() => setFinanceClientId(null)} className="w-full py-5 rounded-2xl bg-slate-900 text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl active:scale-[0.98] transition-all">Selesai</button>
                </div>
             </div>
          </div>
        )}

        {selectedClientId && (
          <div className="fixed inset-0 z-[120] flex items-end justify-center p-0">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setSelectedClientId(null)}></div>
            <div className="relative bg-white w-full max-w-md rounded-t-[2.5rem] p-8 shadow-2xl max-h-[90vh] flex flex-col animate-in slide-in-from-bottom duration-400">
              <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-8 shrink-0"></div>
              <div className="flex items-start justify-between mb-8 shrink-0">
                <div className="flex-1 pr-6">
                  <p className="text-indigo-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Execution Mode</p>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tighter leading-tight">{selectedClient?.name}</h3>
                </div>
                <button onClick={() => setSelectedClientId(null)} className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 active:scale-90 transition-all"><X size={20}/></button>
              </div>
              
              <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 mb-8">
                {selectedClient?.tasks?.length > 0 ? selectedClient?.tasks?.map(t => (
                  <label key={t.id} className={`flex items-center gap-4 p-5 rounded-2xl border transition-all cursor-pointer group ${t.completed ? 'bg-emerald-50/30 border-emerald-100/50' : 'bg-white border-slate-100 hover:border-indigo-200'}`}>
                    <input type="checkbox" className="hidden" checked={t.completed} onChange={() => toggleTask(selectedClient.id, t.id)} />
                    <div className={`transition-all duration-300 ${t.completed ? 'text-emerald-500' : 'text-slate-200'}`}>
                      {t.completed ? <CheckCircle2 size={26} /> : <Circle size={26} />}
                    </div>
                    <span className={`font-bold text-sm flex-1 tracking-tight ${t.completed ? 'text-emerald-900/40 line-through' : 'text-slate-700'}`}>{t.label}</span>
                  </label>
                )) : (
                   <div className="text-center py-10">
                      <p className="text-xs text-slate-400 italic">Memuat tugas...</p>
                   </div>
                )}
              </div>
              <button onClick={() => setSelectedClientId(null)} className="w-full py-5 rounded-2xl bg-indigo-600 text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl active:scale-[0.98] transition-all shrink-0">Simpan & Tutup</button>
            </div>
          </div>
        )}
      </div>
      
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,800&display=swap');
        :root { scrollbar-width: none; -ms-overflow-style: none; }
        body { font-family: 'Plus Jakarta Sans', sans-serif; background: #f8fafc; overflow: hidden; height: 100vh; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slide-in { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .animate-in { animation-duration: 0.4s; animation-fill-mode: both; }
        .fade-in { animation-name: fade-in; }
        .slide-in-from-bottom { animation-name: slide-in; cubic-bezier(0.16, 1, 0.3, 1); }
      `}</style>
    </div>
  );
};

const DetailItem = ({ icon, label, value }) => (
  <div className="flex items-start gap-4">
     <div className="w-10 h-10 bg-slate-50 text-indigo-500 rounded-xl flex items-center justify-center shrink-0 border border-slate-100 shadow-sm mt-0.5">{icon}</div>
     <div className="overflow-hidden">
        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1.5">{label}</p>
        <p className="text-[11px] font-bold text-slate-900 break-words leading-relaxed">{value || 'N/A'}</p>
     </div>
  </div>
);

const NavItem = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1.5 transition-all flex-1 ${active ? 'scale-105' : 'text-slate-300'}`}>
    <div className={`p-2.5 rounded-xl transition-all duration-300 ${active ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-200' : 'hover:bg-slate-50'}`}>{icon}</div>
    <span className={`text-[8px] font-bold uppercase tracking-widest transition-all duration-300 ${active ? 'text-indigo-600 opacity-100' : 'opacity-0 h-0'}`}>{label}</span>
  </button>
);

export default App;
