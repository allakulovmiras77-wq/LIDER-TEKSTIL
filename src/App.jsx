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
