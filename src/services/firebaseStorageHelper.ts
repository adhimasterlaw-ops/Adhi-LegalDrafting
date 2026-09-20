/**
 * ============================================================================
 * FIREBASE STORAGE HELPER & CLIENT CONFIGURATION
 * ADHI LEGAL DRAFTING SYSTEM
 * ============================================================================
 * Modul ini menangani pengunggahan file referensi kesehatan daerah (PDF/CSV/TXT)
 * ke Firebase Storage Bucket dan mengembalikan Download URL publik yang valid.
 */

export interface FirebaseConfigOptions {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
}

/**
 * Konfigurasi Default / Template Firebase Storage
 * Pengguna dapat memasukkan kredensial Firebase mereka jika memiliki project aktif,
 * atau sistem akan menggunakan mode Direct Upload (Base64/Local Buffer) yang secara
 * transparan didukung penuh oleh backend Express kita.
 */
export const DEFAULT_FIREBASE_STORAGE_BUCKET =
  (typeof window !== 'undefined' && (window as any).__FIREBASE_STORAGE_BUCKET__) ||
  'adhi-legal-drafting.appspot.com';

/**
 * Fungsi Pengunggahan File ke Firebase Storage
 * @param file Objek File dari HTML File Input
 * @param onProgress Callback untuk persentase progress upload
 * @returns Promise<string> Download URL dari Firebase Storage
 */
export async function uploadReferenceFileToFirebase(
  file: File,
  onProgress?: (progressPercent: number) => void,
  subDirectory: string = 'referensi-kesehatan'
): Promise<{ downloadUrl: string; storagePath: string; isSimulated: boolean }> {
  const timestamp = Date.now();
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const storagePath = `${subDirectory}/${timestamp}_${sanitizedName}`;

  // Logika pengecekan apakah Firebase SDK tersedia di runtime global/eksternal
  const hasExternalFirebase = typeof window !== 'undefined' && (window as any).firebase?.storage;

  if (hasExternalFirebase) {
    try {
      const storage = (window as any).firebase.storage();
      const storageRef = storage.ref(storagePath);
      const uploadTask = storageRef.put(file);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot: any) => {
            const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            if (onProgress) onProgress(percent);
          },
          (error: any) => {
            console.error('[Firebase Storage Error]:', error);
            reject(error);
          },
          async () => {
            const downloadUrl = await uploadTask.snapshot.ref.getDownloadURL();
            resolve({ downloadUrl, storagePath, isSimulated: false });
          }
        );
      });
    } catch (err) {
      console.warn('[Firebase Storage] Fallback ke Direct Storage Pipeline:', err);
    }
  }

  // Jika Firebase Bucket eksternal belum dikonfigurasi, simulasikan progress upload visual
  // dan gunakan Data URL yang dapat diunduh langsung oleh backend axios/buffer
  for (let p = 10; p <= 100; p += 25) {
    if (onProgress) onProgress(p);
    await new Promise((res) => setTimeout(res, 80));
  }

  // Konversi file ke Data URL (Base64) yang juga diterima langsung oleh backend kita
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  return {
    downloadUrl: dataUrl,
    storagePath,
    isSimulated: true,
  };
}
