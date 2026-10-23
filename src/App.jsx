import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Package, QrCode, Layers, BarChart2, History, Settings, Search, PlusCircle, Volume2, VolumeX, AlertTriangle, ArrowRightLeft, ArrowUpRight, ArrowDownLeft, Printer, Check, X, Shield, RefreshCw, Filter, FileText, Tag, ChevronRight, User, Trash2, Camera } from 'lucide-react';

// --- Web Audio API Synth for Beeps and Alerts ---
class AudioFeedback {
  static ctx = null;
  static init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
  }
  static playSuccess() {
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1760, this.ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(); osc.stop(this.ctx.currentTime + 0.12);
      if (navigator.vibrate) navigator.vibrate(50);
    } catch (e) { console.error(e); }
  }
  static playError() {
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(110, this.ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(); osc.stop(this.ctx.currentTime + 0.25);
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    } catch (e) { console.error(e); }
  }
}

const SIZES = ['S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'];
const INITIAL_USERS = [
  { id: 1, name: 'Алишер', role: 'Кладовщик' },
  { id: 2, name: 'Даврон', role: 'Администратор' },
  { id: 3, name: 'Сардор', role: 'Наблюдатель' }
];

const INITIAL_PRODUCTS = [
  { id: 1, article: 'XM11', name: 'Халат Махровый Люкс', material: 'Махра', colorCode: '1 (Белый)', is_active: true },
  { id: 2, article: 'MK1', name: 'Халат Кимоно Классик', material: 'Вафля', colorCode: '1 (Белый)', is_active: true },
  { id: 3, article: 'MK4', name: 'Халат Кимоно Узор', material: 'Вафля', colorCode: '4 (Бежевый)', is_active: true },
  { id: 4, article: 'KB2', name: 'Халат Банный С Капюшоном', material: 'Махра', colorCode: '2 (Графит)', is_active: true }
];

const INITIAL_BARCODES = [
  { id: 1, barcode: '4601234567011', article: 'XM11', size: '2XL' },
  { id: 2, barcode: '4601234567012', article: 'XM11', size: '3XL' },
  { id: 3, barcode: '4601234567021', article: 'MK1', size: '5XL' },
  { id: 4, barcode: '4601234567031', article: 'MK4', size: 'XL' }
];

const INITIAL_BAGS = [
  { id: 1, number: 'MIX-001', type: 'MIX', status: 'filled', orderRef: '', description: 'Смешанная коробка халатов', createdAt: '2026-10-20 10:15', updatedAt: '2026-10-23 14:20', creator: 'Алишер', items: [ { article: 'XM11', size: '2XL', quantity: 8 }, { article: 'XM11', size: '3XL', quantity: 13 } ] },
  { id: 2, number: 'UZUM-001', type: 'UZUM MARKET', status: 'filled', orderRef: 'UZ-9942', description: 'Партия Uzum Express', createdAt: '2026-10-21 11:30', updatedAt: '2026-10-22 16:45', creator: 'Алишер', items: [ { article: 'MK1', size: 'XL', quantity: 25 } ] },
  { id: 3, number: 'MONO-001', type: 'MONO', status: 'filled', orderRef: '', description: 'Моно-мешок XM11', createdAt: '2026-10-22 09:00', updatedAt: '2026-10-24 08:30', creator: 'Даврон', items: [ { article: 'XM11', size: 'L', quantity: 30 } ] },
  { id: 4, number: 'MONO-002', type: 'MONO', status: 'empty', orderRef: '', description: 'Новый пустой мешок', createdAt: '2026-10-23 15:10', updatedAt: '2026-10-23 15:10', creator: 'Алишер', items: [] }
];

const INITIAL_HISTORY = [
  { id: 1, time: '2026-10-24 08:30', user: 'Даврон', action: 'ADD', bag: 'MONO-001', article: 'XM11', size: 'L', qtyChange: 20, comment: 'Приход с цеха' }
];
export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [currentUser, setCurrentUser] = useState(INITIAL_USERS[0]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [toast, setToast] = useState({ message: '', type: 'success', visible: false });

  const [bags, setBags] = useState(INITIAL_BAGS);
  const [products] = useState(INITIAL_PRODUCTS);
  const [barcodes] = useState(INITIAL_BARCODES);
  const [history, setHistory] = useState(INITIAL_HISTORY);

  const [activeBag, setActiveBag] = useState(null);
  const [showBagActionModal, setShowBagActionModal] = useState(null); 
  const [showQrModal, setShowQrModal] = useState(null);
  const [actionForm, setActionForm] = useState({ article: '', size: '', quantity: '', comment: '', targetBagId: '' });

  const [scanState, setScanState] = useState({ active: false, result: '', error: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [bagTypeFilter, setBagTypeFilter] = useState('all');
  const [bagStatusFilter, setBagStatusFilter] = useState('all');

  const scanVideoRef = useRef(null);
  const scanStreamRef = useRef(null);

  const generateId = (list) => Math.max(...list.map(i => i.id), 0) + 1;
  const generateNewBagNumber = (type) => {
    const prefix = type === 'UZUM MARKET' ? 'UZUM' : type;
    const filtered = bags.filter(b => b.number.startsWith(prefix));
    return `${prefix}-${String(filtered.length + 1).padStart(3, '0')}`;
  };

  const notify = (message, type = 'success') => {
    if (soundEnabled) {
      if (type === 'success' || type === 'info') AudioFeedback.playSuccess();
      else AudioFeedback.playError();
    }
    setToast({ message, type, visible: true });
    setTimeout(() => setToast(s => ({ ...s, visible: false })), 3500);
  };

  const canEdit = currentUser.role !== 'Наблюдатель';

  const handleCreateBag = (type) => {
    if (!canEdit) return notify('Нет прав для выполнения операции', 'error');
    const newBag = {
      id: generateId(bags),
      number: generateNewBagNumber(type),
      type,
      status: 'empty',
      orderRef: '',
      description: type === 'MONO' ? 'Новый моно-мешок' : type === 'UZUM MARKET' ? 'Отгрузка Uzum' : 'Смешанный мешок',
      createdAt: new Date().toLocaleString().slice(0, 16).replace(',', ''),
      updatedAt: new Date().toLocaleString().slice(0, 16).replace(',', ''),
      creator: currentUser.name,
      items: []
    };
    setBags([newBag, ...bags]);
    setHistory([{ id: generateId(history), time: newBag.createdAt, user: currentUser.name, action: 'CREATE_BAG', bag: newBag.number, article: '-', size: '-', qtyChange: 0, comment: 'Создан мешок' }, ...history]);
    notify(`Мешок ${newBag.number} успешно создан`);
  };

  const handleBagAction = (e) => {
    e.preventDefault();
    if (!canEdit) return notify('Нет прав', 'error');
    const qtyNum = parseInt(actionForm.quantity, 10);
    if (isNaN(qtyNum) || qtyNum <= 0) return notify('Укажите количество > 0', 'error');

    const updatedBags = [...bags];
    const bagIndex = updatedBags.findIndex(b => b.id === activeBag.id);
    if (bagIndex === -1) return;
    const targetBag = updatedBags[bagIndex];

    const { article, size, comment, targetBagId } = actionForm;
    let newHistoryEntries = [];

    if (showBagActionModal === 'ADD' || showBagActionModal === 'ISSUE') {
      if (!article || !size) return notify('Выберите товар и размер', 'error');

      if (showBagActionModal === 'ADD' && targetBag.type === 'MONO' && targetBag.items.length > 0 && targetBag.items[0].article !== article) {
          return notify(`В мешок MONO (${targetBag.number}) нельзя добавить другой артикул!`, 'error');
      }

      const itemIndex = targetBag.items.findIndex(i => i.article === article && i.size === size);
      const isRemoving = showBagActionModal === 'ISSUE';
      const actualQtyChange = isRemoving ? -qtyNum : qtyNum;

      if (isRemoving) {
        if (itemIndex === -1 || targetBag.items[itemIndex].quantity < qtyNum) {
          return notify('Недостаточно товаров в мешке', 'error');
        }
        targetBag.items[itemIndex].quantity -= qtyNum;
        if (targetBag.items[itemIndex].quantity === 0) targetBag.items.splice(itemIndex, 1);
      } else {
        if (itemIndex >= 0) targetBag.items[itemIndex].quantity += qtyNum;
        else targetBag.items.push({ article, size, quantity: qtyNum });
      }

      targetBag.status = targetBag.items.length > 0 ? 'filled' : 'empty';
      targetBag.updatedAt = new Date().toLocaleString().slice(0, 16).replace(',', '');

      newHistoryEntries.push({
        id: generateId(history),
        time: targetBag.updatedAt,
        user: currentUser.name,
        action: showBagActionModal,
        bag: targetBag.number,
        article,
        size,
        qtyChange: actualQtyChange,
        comment
      });
    } else if (showBagActionModal === 'TRANSFER') {
      if (!article || !size) return notify('Выберите товар и размер', 'error');
      const targetBagRecord = updatedBags.find(b => b.number === targetBagId);
      if (!targetBagRecord) return notify('Целевой мешок не найден', 'error');
      if (targetBagRecord.number === targetBag.number) return notify('Нельзя переместить в тот же мешок', 'error');

      const sourceItemIndex = targetBag.items.findIndex(i => i.article === article && i.size === size);
      if (sourceItemIndex === -1 || targetBag.items[sourceItemIndex].quantity < qtyNum) {
        return notify('Недостаточно товаров в исходном мешке', 'error');
      }

      targetBag.items[sourceItemIndex].quantity -= qtyNum;
      if (targetBag.items[sourceItemIndex].quantity === 0) targetBag.items.splice(sourceItemIndex, 1);
      targetBag.status = targetBag.items.length > 0 ? 'filled' : 'empty';
      targetBag.updatedAt = new Date().toLocaleString().slice(0, 16).replace(',', '');

      const destItemIndex = targetBagRecord.items.findIndex(i => i.article === article && i.size === size);
      if (destItemIndex >= 0) targetBagRecord.items[destItemIndex].quantity += qtyNum;
      else targetBagRecord.items.push({ article, size, quantity: qtyNum });
      targetBagRecord.status = 'filled';
      targetBagRecord.updatedAt = targetBag.updatedAt;

      newHistoryEntries.push({
        id: generateId(history),
        time: targetBag.updatedAt,
        user: currentUser.name,
        action: 'TRANSFER',
        bag: targetBag.number,
        article,
        size,
        qtyChange: -qtyNum,
        comment: `Перемещено в ${targetBagRecord.number}. ${comment}`
      });
    }

    setBags(updatedBags);
    setHistory([...newHistoryEntries.reverse(), ...history]);
    setActiveBag(updatedBags.find(b => b.id === activeBag.id));
    notify('Операция успешно выполнена');
    setShowBagActionModal(null);
    setActionForm({ article: '', size: '', quantity: '', comment: '', targetBagId: '' });
  };

  const handleArchiveBag = (bagId) => {
    if (!canEdit) return notify('Нет прав', 'error');
    if (!confirm('Архивировать этот мешок?')) return;
    setBags(bags.map(b => b.id === bagId ? { ...b, status: 'archive' } : b));
    notify('Мешок отправлен в архив');
  };

  const startScanner = async () => {
    try {
      setScanState({ active: true, result: '', error: '' });
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (scanVideoRef.current) {
        scanVideoRef.current.srcObject = stream;
        scanVideoRef.current.play();
      }
      scanStreamRef.current = stream;
    } catch (err) {
      setScanState({ active: false, result: '', error: 'Нет доступа к камере' });
    }
  };

  const stopScanner = () => {
    if (scanStreamRef.current) {
      scanStreamRef.current.getTracks().forEach(t => t.stop());
      scanStreamRef.current = null;
    }
    setScanState({ active: false, result: '', error: '' });
  };

  const simulateScan = (code) => {
    stopScanner();
    const foundBag = bags.find(b => b.number === code);
    if (foundBag) {
      notify(`Найден мешок: ${foundBag.number}`, 'success');
      setActiveBag(foundBag);
      setActiveTab('bags');
    } else {
      notify(`Код ${code} не найден`, 'error');
    }
  };

  const totals = useMemo(() => {
    let totalRobes = 0, filledBags = 0, emptyBags = 0, uzumCount = 0;
    bags.forEach(bag => {
      if (bag.status === 'archive') return;
      let bagTotal = 0;
      bag.items.forEach(i => { bagTotal += i.quantity; totalRobes += i.quantity; });
      if (bag.type === 'UZUM MARKET' && bagTotal > 0) uzumCount += bagTotal;
      if (bagTotal > 0) filledBags++; else emptyBags++;
    });
    return { totalRobes, filledBags, emptyBags, uzumCount };
  }, [bags]);

  const topProducts = useMemo(() => {
    const map = {};
    bags.forEach(bag => {
      if (bag.status === 'archive') return;
      bag.items.forEach(i => {
        const key = `${i.article} | ${i.size}`;
        if (!map[key]) map[key] = { article: i.article, size: i.size, quantity: 0 };
        map[key].quantity += i.quantity;
      });
    });
    return Object.values(map).sort((a, b) => b.quantity - a.quantity);
  }, [bags]);

  const totalMatrix = useMemo(() => {
    const map = {};
    bags.forEach(bag => {
      if (bag.status === 'archive') return;
      bag.items.forEach(i => {
        const key = `${i.article} | ${i.size}`;
        if (!map[key]) map[key] = { article: i.article, size: i.size, quantity: 0 };
        map[key].quantity += i.quantity;
      });
    });
    return Object.values(map);
  }, [bags]);

  const filteredBags = bags.filter(bag => {
    if (bag.status === 'archive' && bagStatusFilter !== 'archive') return false;
    if (bagStatusFilter !== 'all' && bagStatusFilter !== 'archive' && bag.status !== bagStatusFilter) return false;
    if (bagTypeFilter !== 'all' && bag.type !== bagTypeFilter) return false;
    const s = searchQuery.toLowerCase();
    return bag.number.toLowerCase().includes(s) || bag.type.toLowerCase().includes(s);
  });

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex font-sans overflow-x-hidden">
      <aside className="hidden md:flex flex-col w-64 bg-gray-900 border-r border-gray-800 h-screen sticky top-0">
        <div className="p-5 border-b border-gray-800 flex items-center space-x-3">
          <div className="bg-teal-500 text-gray-950 font-black px-3 py-1.5 rounded-xl text-xl">LT</div>
          <div>
            <h1 className="font-bold text-sm text-white">Lider Tekstil</h1>
            <p className="text-[10px] text-teal-500 uppercase font-semibold">Warehouse</p>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1 mt-2">
          {[
            { id: 'overview', icon: BarChart2, label: 'Склад' },
            { id: 'bags', icon: Layers, label: 'Мешки' },
            { id: 'scan', icon: QrCode, label: 'Скан' },
            { id: 'catalog', icon: Package, label: 'Каталог' },
            { id: 'totals', icon: FileText, label: 'Итого' },
            { id: 'history', icon: History, label: 'История' },
          ].map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${activeTab === item.id ? 'bg-teal-600 text-white' : 'text-slate-400 hover:bg-gray-800 hover:text-teal-400'}`}>
              <item.icon size={18} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-h-0 w-full max-w-full">
        <main className="flex-1 overflow-y-auto w-full max-w-7xl mx-auto p-4 md:p-6 pb-24 md:pb-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-black text-white">Обзор склада</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-900 border border-gray-800 p-4 rounded-2xl"><p className="text-xs text-slate-500 uppercase">Всего халатов</p><p className="text-3xl font-black text-white mt-2">{totals.totalRobes}</p></div>
                <div className="bg-gray-900 border border-gray-800 p-4 rounded-2xl"><p className="text-xs text-slate-500 uppercase">Заполненные</p><p className="text-3xl font-black text-white mt-2">{totals.filledBags}</p></div>
                <div className="bg-gray-900 border border-gray-800 p-4 rounded-2xl"><p className="text-xs text-slate-500 uppercase">Пустые</p><p className="text-3xl font-black text-white mt-2">{totals.emptyBags}</p></div>
                <div className="bg-gray-900 border border-gray-800 p-4 rounded-2xl"><p className="text-xs text-slate-500 uppercase">Uzum Market</p><p className="text-3xl font-black text-white mt-2">{totals.uzumCount}</p></div>
              </div>
            </div>
          )}

          {activeTab === 'bags' && (
            <div className="space-y-6">
              {activeBag ? (
                <div className="space-y-6">
                  <button onClick={() => setActiveBag(null)} className="bg-gray-900 border border-gray-800 p-3 rounded-2xl text-slate-400">Назад к списку</button>
                  <h2 className="text-2xl font-black text-white">Мешок <span className="text-teal-400">{activeBag.number}</span></h2>
                  <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                    <h3 className="font-black text-lg text-white mb-4">Содержимое</h3>
                    {activeBag.items.map((i, idx) => (
                      <div key={idx} className="flex justify-between bg-gray-950 p-3 rounded-xl mb-2">
                        <span className="text-teal-400 font-bold">{i.article} ({i.size})</span>
                        <span className="text-white font-bold">{i.quantity} шт.</span>
                      </div>
                    ))}
                    {canEdit && (
                      <div className="flex gap-4 mt-4">
                        <button onClick={() => setShowBagActionModal('ADD')} className="bg-teal-600 text-white px-4 py-2 rounded-xl font-bold">Добавить</button>
                        <button onClick={() => setShowBagActionModal('ISSUE')} className="bg-gray-800 text-white px-4 py-2 rounded-xl font-bold">Списать</button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex justify-between">
                    <h2 className="text-2xl font-black text-white">Мешки</h2>
                    {canEdit && <button onClick={() => handleCreateBag('MONO')} className="bg-teal-600 text-white px-4 py-2 rounded-xl font-bold">+ Мешок</button>}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {filteredBags.map(bag => (
                      <div key={bag.id} onClick={() => setActiveBag(bag)} className="bg-gray-900 border border-gray-800 p-4 rounded-2xl cursor-pointer hover:border-teal-500">
                        <h3 className="font-bold text-white text-lg">{bag.number}</h3>
                        <p className="text-xs text-slate-400 mt-1">{bag.type}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'scan' && (
            <div className="space-y-6 max-w-lg mx-auto text-center">
              <h2 className="text-2xl font-black text-white">Сканер</h2>
              {!scanState.active ? (
                <div className="bg-gray-900 p-6 rounded-3xl border border-gray-800 space-y-4">
                  <button onClick={startScanner} className="w-full bg-teal-600 text-white py-4 rounded-2xl font-bold">Включить камеру</button>
                  <button onClick={() => simulateScan('MIX-001')} className="w-full bg-gray-800 text-white py-3 rounded-xl font-semibold">Эмулировать MIX-001</button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="aspect-square bg-black rounded-2xl overflow-hidden relative">
                    <video ref={scanVideoRef} className="w-full h-full object-cover" muted playsInline />
                  </div>
                  <button onClick={stopScanner} className="w-full bg-red-600 text-white py-3 rounded-2xl font-bold">Закрыть</button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'catalog' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-black text-white">Каталог</h2>
              <div className="bg-gray-900 border border-gray-800 rounded-3xl p-4">
                {products.map(p => (
                  <div key={p.id} className="flex justify-between py-2 border-b border-gray-800">
                    <span className="font-bold text-teal-400">{p.article}</span>
                    <span className="text-white">{p.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'totals' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-black text-white">Итоговые остатки</h2>
              <div className="bg-gray-900 border border-gray-800 rounded-3xl p-4">
                {totalMatrix.map((t, idx) => (
                  <div key={idx} className="flex justify-between py-2 border-b border-gray-800">
                    <span className="text-teal-400 font-bold">{t.article} / {t.size}</span>
                    <span className="text-white font-black">{t.quantity} шт.</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-black text-white">История операций</h2>
              <div className="bg-gray-900 border border-gray-800 rounded-3xl p-4">
                {history.map(h => (
                  <div key={h.id} className="py-2 border-b border-gray-800 text-sm">
                    <span className="text-teal-400 font-bold">{h.bag}</span> — <span className="text-white">{h.action}</span> ({h.qtyChange})
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>

        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 flex py-2 z-50">
          {[
            { id: 'overview', icon: BarChart2, label: 'Склад' },
            { id: 'bags', icon: Layers, label: 'Мешки' },
            { id: 'scan', icon: QrCode, label: 'Скан' },
            { id: 'catalog', icon: Package, label: 'Каталог' },
            { id: 'totals', icon: FileText, label: 'Итого' },
          ].map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex-1 flex flex-col items-center py-2 ${activeTab === item.id ? 'text-teal-400' : 'text-slate-600'}`}>
              <item.icon size={20} />
              <span className="text-[9px] font-bold uppercase mt-1">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {toast.visible && (
        <div className="fixed top-4 right-4 z-50 bg-gray-950 border border-teal-500 text-white px-4 py-3 rounded-2xl shadow-xl">
          {toast.message}
        </div>
      )}
    </div>
  );
              }
