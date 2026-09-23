import { Product } from '../types';

export const INITIAL_PRODUCTS: Product[] = [
  { id: 'p1', name: 'ماء معدني 0.5 لتر', price: 35, costPrice: 25, stock: 48, category: 'مشروبات', barcode: '6131001' },
  { id: 'p2', name: 'علبة حليب 1 لتر', price: 120, costPrice: 100, stock: 24, category: 'مواد غذائية', barcode: '6131002' },
  { id: 'p3', name: 'قهوة مطحونة 250 غرام', price: 350, costPrice: 280, stock: 15, category: 'مواد غذائية', barcode: '6131003' },
  { id: 'p4', name: 'قميص قطني كاجوال', price: 1800, costPrice: 1200, stock: 8, category: 'ملابس وأزياء', barcode: '6131004' },
  { id: 'p5', name: 'سروال جينز رجالي', price: 2800, costPrice: 1900, stock: 5, category: 'ملابس وأزياء', barcode: '6131005' },
  { id: 'p6', name: 'شاحن هاتف سريع Type-C', price: 1200, costPrice: 750, stock: 12, category: 'إلكترونيات وهواتف', barcode: '6131006' },
  { id: 'p7', name: 'سماعات أذن لاسلكية', price: 2400, costPrice: 1600, stock: 7, category: 'إلكترونيات وهواتف', barcode: '6131007' },
  { id: 'p8', name: 'عطر رجالي / نسائي 50 مل', price: 2200, costPrice: 1400, stock: 10, category: 'عطور وكوسميتيك', barcode: '6131008' },
  { id: 'p9', name: 'مجموعة مفكات يدوية', price: 950, costPrice: 650, stock: 6, category: 'خردوات ولوازم', barcode: '6131009' },
  { id: 'p10', name: 'شامبو للعناية بالشعر 400 مل', price: 450, costPrice: 320, stock: 18, category: 'عطور وكوسميتيك', barcode: '6131010' },
  { id: 'p11', name: 'كراس مدرسي 96 صفحة', price: 85, costPrice: 60, stock: 60, category: 'مكتبة ولوازم', barcode: '6131011' },
  { id: 'p12', name: 'مصباح LED اقتصادي 12 واط', price: 260, costPrice: 170, stock: 25, category: 'خردوات ولوازم', barcode: '6131012' },
];

export const DEFAULT_CURRENCY = 'د.ج';
