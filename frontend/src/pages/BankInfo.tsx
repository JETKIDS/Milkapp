import React from 'react';
import { useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormTextField } from '../components/FormTextField';
import { putDataTyped } from '../lib/typedApi';
import { useToast } from '../components/Toast';

const schema = z.object({
  bankBranchCode7: z.string().regex(/^\d{7}$/, '銀行コード+支店コードは7桁の数字'),
  accountNumber7: z.string().regex(/^\d{7}$/, '口座番号は7桁の数字'),
  accountHolderKana: z.string().regex(/^[\u30A0-\u30FF\uFF65-\uFF9F\s]+$/, '半角カタカナで入力してください'),
  customerCode7: z.string().regex(/^\d{7}$/, '顧客コードは7桁の数字'),
});

type FormValues = z.infer<typeof schema>;

export function BankInfoPage() {
  const { id } = useParams();
  const customerId = Number(id);
  const toast = useToast();
  const form = useForm<FormValues>({ resolver: zodResolver(schema) });

  // 顧客コードはIDを7桁ゼロ埋めで初期入力
  React.useEffect(() => {
    if (Number.isFinite(customerId)) {
      const padded = String(customerId).padStart(7, '0');
      form.setValue('customerCode7', padded, { shouldValidate: true });
    }
  }, [customerId]);

  // ひらがな→カタカナ、全角→半角カナに自動変換
  const toHalfWidthKana = (input: string): string => {
    if (!input) return '';
    // ひらがな→カタカナ
    const toKatakana = input.replace(/[\u3041-\u3096]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) + 0x60));
    // 全角スペース→半角スペース
    const s = toKatakana.replace(/\u3000/g, ' ');
    const map: Record<string, string> = {
      'ァ':'ｧ','ア':'ｱ','ィ':'ｨ','イ':'ｲ','ゥ':'ｩ','ウ':'ｳ','ェ':'ｪ','エ':'ｴ','ォ':'ｫ','オ':'ｵ',
      'カ':'ｶ','ガ':'ｶﾞ','キ':'ｷ','ギ':'ｷﾞ','ク':'ｸ','グ':'ｸﾞ','ケ':'ｹ','ゲ':'ｹﾞ','コ':'ｺ','ゴ':'ｺﾞ',
      'サ':'ｻ','ザ':'ｻﾞ','シ':'ｼ','ジ':'ｼﾞ','ス':'ｽ','ズ':'ｽﾞ','セ':'ｾ','ゼ':'ｾﾞ','ソ':'ｿ','ゾ':'ｿﾞ',
      'タ':'ﾀ','ダ':'ﾀﾞ','チ':'ﾁ','ヂ':'ﾁﾞ','ッ':'ｯ','ツ':'ﾂ','ヅ':'ﾂﾞ','テ':'ﾃ','デ':'ﾃﾞ','ト':'ﾄ','ド':'ﾄﾞ',
      'ナ':'ﾅ','ニ':'ﾆ','ヌ':'ﾇ','ネ':'ﾈ','ノ':'ﾉ',
      'ハ':'ﾊ','バ':'ﾊﾞ','パ':'ﾊﾟ','ヒ':'ﾋ','ビ':'ﾋﾞ','ピ':'ﾋﾟ','フ':'ﾌ','ブ':'ﾌﾞ','プ':'ﾌﾟ','ヘ':'ﾍ','ベ':'ﾍﾞ','ペ':'ﾍﾟ','ホ':'ﾎ','ボ':'ﾎﾞ','ポ':'ﾎﾟ',
      'マ':'ﾏ','ミ':'ﾐ','ム':'ﾑ','メ':'ﾒ','モ':'ﾓ',
      'ャ':'ｬ','ヤ':'ﾔ','ュ':'ｭ','ユ':'ﾕ','ョ':'ｮ','ヨ':'ﾖ',
      'ラ':'ﾗ','リ':'ﾘ','ル':'ﾙ','レ':'ﾚ','ロ':'ﾛ',
      'ワ':'ﾜ','ヲ':'ｦ','ン':'ﾝ','・':'･','ー':'ｰ','ヴ':'ｳﾞ',
    };
    let out = '';
    for (const ch of s) {
      out += map[ch] ?? ch;
    }
    return out;
  };

  const composingRef = React.useRef(false);
  const onCompStart = () => { composingRef.current = true; };
  const onCompEnd = (e: React.CompositionEvent<HTMLInputElement>) => {
    composingRef.current = false;
    const target = e.target as HTMLInputElement;
    const v = toHalfWidthKana(target.value);
    form.setValue('accountHolderKana', v, { shouldValidate: true, shouldDirty: true });
  };

  const onSubmit = async (v: FormValues) => {
    try {
      await putDataTyped(`/api/customers/${customerId}`, v);
      toast.notify('success', '口座情報を保存しました');
      window.close();
    } catch {
      toast.notify('error', '保存に失敗しました');
    }
  };

  return (
    <div className="card" style={{ maxWidth: 520, margin: '24px auto' }}>
      <div className="toolbar"><h2 style={{ margin: 0 }}>🏦 口座情報入力</h2></div>
      <form onSubmit={form.handleSubmit(onSubmit)} style={{ display: 'grid', gap: 12 }}>
        <FormTextField label="銀行コード+支店コード（7桁）" placeholder="例: 0001234" {...form.register('bankBranchCode7')} error={form.formState.errors.bankBranchCode7} />
        <FormTextField label="口座番号（7桁）" placeholder="例: 0012345" {...form.register('accountNumber7')} error={form.formState.errors.accountNumber7} />
        <FormTextField label="口座名義（半角カタカナ）" placeholder="ﾔﾏﾀﾞ ﾀﾛｳ"
          {...form.register('accountHolderKana', {
            onBlur: (e) => {
              const v = toHalfWidthKana(e.target.value);
              form.setValue('accountHolderKana', v, { shouldValidate: true, shouldDirty: true });
            },
          })}
          onCompositionStart={onCompStart}
          onCompositionEnd={onCompEnd}
          error={form.formState.errors.accountHolderKana}
        />
        <FormTextField label="顧客コード（7桁）" placeholder="例: 0000123" readOnly {...form.register('customerCode7')} error={form.formState.errors.customerCode7} />
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" className="ghost" onClick={() => window.close()}>閉じる</button>
          <button type="submit">保存</button>
        </div>
      </form>
    </div>
  );
}
