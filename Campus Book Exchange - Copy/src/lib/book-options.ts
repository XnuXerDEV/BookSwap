export const bookCategories = [
  'Buku kuliah',
  'Fiksi',
  'Pengembangan diri',
  'Bisnis & Ekonomi',
  'Desain & Seni',
  'Sains & Teknologi',
] as const
export const bookConditions = ['Seperti baru', 'Baik', 'Cukup terawat'] as const
export const campuses = [
  'Universitas Muhammadiyah Cirebon',
  'Universitas Swadaya Gunung Jati',
  'UIN Siber Syekh Nurjati Cirebon',
  'Institut Prima Bangsa',
] as const
export const MAX_BOOK_PRICE = 2000000
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024
export const photoTypes = ['image/jpeg', 'image/png', 'image/webp']
export const rupiah = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value)
