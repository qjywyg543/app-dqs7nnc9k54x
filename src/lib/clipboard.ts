import { toast } from 'sonner';

export async function copyToClipboard(text: string, successMessage?: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      if (successMessage) toast.success(successMessage);
      return true;
    }
  } catch (e) {
    console.error('Clipboard API 失败', e);
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  textarea.style.top = '0';
  textarea.setAttribute('readonly', 'true');
  document.body.appendChild(textarea);

  try {
    textarea.select();
    const success = document.execCommand('copy');
    if (success) {
      if (successMessage) toast.success(successMessage);
      return true;
    }
  } catch (e) {
    console.error('execCommand 复制失败', e);
  } finally {
    document.body.removeChild(textarea);
  }

  toast.error('复制失败，请手动复制');
  return false;
}
