import { AlertTriangle, Cpu, HelpCircle, Leaf, Recycle, Trash2, type LucideIcon } from 'lucide-react'
import type { CategoryId } from './types'

export interface CategoryMeta {
  id: CategoryId
  name: string
  short: string
  nameEn: string
  /** Màu nhận diện (fill, viền, mask) */
  color: string
  /** Màu chữ đậm hơn, đạt tương phản 4.5:1 trên nền trắng */
  ink: string
  soft: string
  icon: LucideIcon
  bin: string
  examples: string[]
}

export const CATEGORY_ORDER: CategoryId[] = ['organic', 'recyclable', 'nonrecyclable', 'hazardous', 'ewaste', 'other']

export const CATEGORY_META: Record<CategoryId, CategoryMeta> = {
  organic: {
    id: 'organic', name: 'Rác hữu cơ', short: 'Hữu cơ', nameEn: 'Organic',
    color: '#22C55E', ink: '#15803D', soft: '#DCFCE7', icon: Leaf,
    bin: 'Thùng rác hữu cơ (xanh lá)',
    examples: ['Thức ăn thừa', 'Rau củ quả', 'Lá cây', 'Vỏ trái cây'],
  },
  recyclable: {
    id: 'recyclable', name: 'Rác tái chế', short: 'Tái chế', nameEn: 'Recyclable',
    color: '#0EA5E9', ink: '#0369A1', soft: '#E0F2FE', icon: Recycle,
    bin: 'Thùng rác tái chế (xanh dương)',
    examples: ['Chai nhựa', 'Giấy', 'Bìa carton', 'Lon nhôm', 'Chai thủy tinh'],
  },
  nonrecyclable: {
    id: 'nonrecyclable', name: 'Rác vô cơ', short: 'Vô cơ', nameEn: 'Non-recyclable',
    color: '#64748B', ink: '#475569', soft: '#F1F5F9', icon: Trash2,
    bin: 'Thùng rác vô cơ (xám)',
    examples: ['Túi nilon bẩn', 'Gốm sứ vỡ', 'Rác hỗn hợp khó tái chế'],
  },
  hazardous: {
    id: 'hazardous', name: 'Rác nguy hại', short: 'Nguy hại', nameEn: 'Hazardous',
    color: '#EF4444', ink: '#B91C1C', soft: '#FEE2E2', icon: AlertTriangle,
    bin: 'Điểm thu gom rác nguy hại (đỏ)',
    examples: ['Pin', 'Ắc quy', 'Bóng đèn huỳnh quang', 'Hóa chất gia dụng'],
  },
  ewaste: {
    id: 'ewaste', name: 'Rác điện tử', short: 'Điện tử', nameEn: 'E-waste',
    color: '#A855F7', ink: '#7E22CE', soft: '#F3E8FF', icon: Cpu,
    bin: 'Điểm thu hồi rác điện tử (tím)',
    examples: ['Điện thoại cũ', 'Linh kiện điện tử', 'Dây điện', 'Thiết bị hỏng'],
  },
  other: {
    id: 'other', name: 'Rác khác', short: 'Khác', nameEn: 'Other',
    color: '#F59E0B', ink: '#B45309', soft: '#FEF3C7', icon: HelpCircle,
    bin: 'Cần kiểm tra thủ công',
    examples: ['Vật thể chưa xác định được nhóm'],
  },
}

export const categoryMeta = (id: string | null | undefined): CategoryMeta =>
  CATEGORY_META[(id as CategoryId) ?? 'other'] ?? CATEGORY_META.other
