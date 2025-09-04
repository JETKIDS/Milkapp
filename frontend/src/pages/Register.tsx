import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormTextField } from '../components/FormTextField';
import { FormSelect } from '../components/FormSelect';
import { FormNumberField } from '../components/FormNumberField';
import { apiGet, apiJson } from '../lib/api';
import { postDataTyped } from '../lib/typedApi';
import { useToast } from '../components/Toast';
import { Loading } from '../components/Loading';

// 顧客登録のスキーマ
const customerSchema = z.object({
	// ID設定（オプション）
	customId: z.string().optional(),
	
	// 基本情報
	name: z.string().min(1, '顧客名は必須です'),
	furigana: z.string().optional(),
	companyName: z.string().optional(),
	
	// 住所情報
	postalCode: z.string().optional(),
	address1: z.string().min(1, '住所は必須です'),
	address2: z.string().optional(),
	
	// 連絡先情報
	phone: z.string().optional(),
	fax: z.string().optional(),
	mobile: z.string().optional(),
	email: z.string().email('有効なメールアドレスを入力してください').optional().or(z.literal('')),
	
	// 配達・集金情報
	deliveryCourseId: z.number().optional(),
	collectionMethod: z.enum(['cash', 'direct_debit', 'credit']).optional(),
	
	// 契約情報
	contractStatus: z.enum(['active', 'suspended', 'terminated']).default('active'),
	contractStartDate: z.string().optional(),
	
	// 紹介・営業情報
	referrer: z.string().optional(),
	salesPerson: z.string().optional(),
	
	// メモ
	memo: z.string().optional(),
});

// メーカー登録のスキーマ
const manufacturerSchema = z.object({
	// ID設定（オプション）
	customId: z.string().optional(),
	
	name: z.string().min(1, '必須です'),
	contactInfo: z.string().optional(),
});

// 商品登録のスキーマ
const productSchema = z.object({
	// ID設定（オプション）
	customId: z.string().optional(),
	
	name: z.string().min(1, '必須です'),
	manufacturerId: z.number().min(1, 'メーカーを選択してください'),
	price: z.number().min(0, '0以上の値を入力してください'),
	unit: z.string().min(1, '必須です'),
	description: z.string().optional(),
	stock: z.number().min(0, '0以上の値を入力してください').optional(),
});

// 配達コース登録のスキーマ
const courseSchema = z.object({
	// ID設定（オプション）
	customId: z.string().optional(),
	
	name: z.string().min(1, '必須です'),
	description: z.string().optional(),
});

// 店舗登録のスキーマ
const storeSchema = z.object({
    name: z.string().min(1, '店舗名は必須です'),
    address: z.string().min(1, '住所は必須です'),
    phone: z.string().optional(),
});

type CustomerFormValues = z.infer<typeof customerSchema>;
type ManufacturerFormValues = z.infer<typeof manufacturerSchema>;
type ProductFormValues = z.infer<typeof productSchema>;
type CourseFormValues = z.infer<typeof courseSchema>;
type StoreFormValues = z.infer<typeof storeSchema>;

export function RegisterPage() {
	const toast = useToast();
	const [activeTab, setActiveTab] = React.useState<'customer' | 'manufacturer' | 'product' | 'course' | 'store'>('customer');
	const [manufacturers, setManufacturers] = React.useState<any[]>([]);
	const [deliveryCourses, setDeliveryCourses] = React.useState<any[]>([]);
	const [loadingManufacturers, setLoadingManufacturers] = React.useState(false);
	const [loadingCourses, setLoadingCourses] = React.useState(false);
	
	// ID設定の状態管理
	const [useCustomId, setUseCustomId] = React.useState({
		customer: false,
		manufacturer: false,
		product: false,
		course: false
	});

	// フォームの設定
	const customerForm = useForm<CustomerFormValues>({ resolver: zodResolver(customerSchema) });
	const manufacturerForm = useForm<ManufacturerFormValues>({ resolver: zodResolver(manufacturerSchema) });
	const productForm = useForm<ProductFormValues>({ resolver: zodResolver(productSchema) });
	const courseForm = useForm<CourseFormValues>({ resolver: zodResolver(courseSchema) });
	const storeForm = useForm<StoreFormValues>({ resolver: zodResolver(storeSchema) });

	// データの取得
	React.useEffect(() => {
		if (activeTab === 'customer') {
			loadDeliveryCourses();
		}
		if (activeTab === 'product') {
			loadManufacturers();
		}
	}, [activeTab]);

	const loadManufacturers = async () => {
		setLoadingManufacturers(true);
		try {
			const data = await apiGet('/api/manufacturers');
			setManufacturers(Array.isArray(data) ? data : []);
		} catch {
			toast.notify('error', 'メーカー一覧の取得に失敗しました');
		} finally {
			setLoadingManufacturers(false);
		}
	};

	const loadDeliveryCourses = async () => {
		setLoadingCourses(true);
		try {
			const data = await apiGet('/api/delivery-courses');
			setDeliveryCourses(Array.isArray(data) ? data : []);
		} catch {
			toast.notify('error', '配達コース一覧の取得に失敗しました');
		} finally {
			setLoadingCourses(false);
		}
	};

	// 顧客登録
	const onSubmitCustomer = async (v: CustomerFormValues) => {
		try {
			// バックエンドが期待する形式に変換
			const customerData = {
				...(v.customId && { id: parseInt(v.customId) || undefined }),
				name: v.name,
				address: `${v.address1}${v.address2 ? ' ' + v.address2 : ''}`,
				phone: v.phone || null,
				email: v.email || null,
				deliveryCourseId: v.deliveryCourseId || null,
				collectionMethod: v.collectionMethod || null,
			};
			await postDataTyped('/api/customers', customerData);
			toast.notify('success', `顧客を登録しました${v.customId ? `（ID: ${v.customId}）` : ''}`);
			customerForm.reset();
			setUseCustomId(prev => ({ ...prev, customer: false }));
		} catch (error: any) {
			const message = error?.response?.data?.error || '顧客の登録に失敗しました';
			toast.notify('error', message);
		}
	};

	// メーカー登録
	const onSubmitManufacturer = async (v: ManufacturerFormValues) => {
		try {
			const manufacturerData = {
				...(v.customId && { id: parseInt(v.customId) || undefined }),
				name: v.name,
				contactInfo: v.contactInfo || null,
			};
			await postDataTyped('/api/manufacturers', manufacturerData);
			toast.notify('success', `メーカーを登録しました${v.customId ? `（ID: ${v.customId}）` : ''}`);
			manufacturerForm.reset();
			setUseCustomId(prev => ({ ...prev, manufacturer: false }));
			// 商品登録で使用するため、メーカー一覧を再読み込み
			if (activeTab === 'product') {
				await loadManufacturers();
			}
		} catch (error: any) {
			const message = error?.response?.data?.error || 'メーカーの登録に失敗しました';
			toast.notify('error', message);
		}
	};

	// 商品登録
	const onSubmitProduct = async (v: ProductFormValues) => {
		try {
			const productData = {
				...(v.customId && { id: parseInt(v.customId) || undefined }),
				name: v.name,
				manufacturerId: v.manufacturerId,
				price: v.price,
				unit: v.unit,
				description: v.description || null,
				stock: v.stock || 99999,
			};
			await postDataTyped('/api/products', productData);
			toast.notify('success', `商品を登録しました${v.customId ? `（ID: ${v.customId}）` : ''}`);
			productForm.reset();
			setUseCustomId(prev => ({ ...prev, product: false }));
		} catch (error: any) {
			const message = error?.response?.data?.error || '商品の登録に失敗しました';
			toast.notify('error', message);
		}
	};

	// 配達コース登録
	const onSubmitCourse = async (v: CourseFormValues) => {
		try {
			const courseData = {
				...(v.customId && { id: parseInt(v.customId) || undefined }),
				name: v.name,
				description: v.description || null,
			};
			await postDataTyped('/api/delivery-courses', courseData);
			toast.notify('success', `配達コースを登録しました${v.customId ? `（ID: ${v.customId}）` : ''}`);
			courseForm.reset();
			setUseCustomId(prev => ({ ...prev, course: false }));
		} catch (error: any) {
			const message = error?.response?.data?.error || '配達コースの登録に失敗しました';
			toast.notify('error', message);
		}
	};

	// 店舗登録
	const onSubmitStore = async (v: StoreFormValues) => {
		try {
			const payload = { name: v.name, address: v.address, phone: v.phone || null };
			await postDataTyped('/api/stores', payload);
			toast.notify('success', '店舗を登録しました');
			storeForm.reset();
		} catch (error: any) {
			toast.notify('error', error?.message ?? '店舗の登録に失敗しました');
		}
	};

	return (
		<div className="card">
			<div className="toolbar">
				<h2 style={{ margin: 0 }}>➕ 新規登録</h2>
			</div>

			{/* タブメニュー */}
			<div className="tabs" style={{ marginBottom: 24 }}>
				<button 
					className={`tab${activeTab === 'customer' ? ' active' : ''}`} 
					onClick={() => setActiveTab('customer')}
				>
					👥 顧客
				</button>
				<button 
					className={`tab${activeTab === 'manufacturer' ? ' active' : ''}`} 
					onClick={() => setActiveTab('manufacturer')}
				>
					🏭 メーカー
				</button>
				<button 
					className={`tab${activeTab === 'product' ? ' active' : ''}`} 
					onClick={() => setActiveTab('product')}
				>
					📦 商品
				</button>
				<button 
					className={`tab${activeTab === 'course' ? ' active' : ''}`} 
					onClick={() => setActiveTab('course')}
				>
					🗺️ 配達コース
				</button>
				<button 
					className={`tab${activeTab === 'store' ? ' active' : ''}`} 
					onClick={() => setActiveTab('store')}
				>
					🏪 店舗
				</button>
			</div>

			{/* 顧客登録フォーム */}
			{activeTab === 'customer' && (
				<div>
					{loadingCourses && <Loading />}
					<form onSubmit={customerForm.handleSubmit(onSubmitCustomer)} style={{ display: 'grid', gap: 24, maxWidth: 800 }}>
						{/* ID設定セクション */}
						<div className="form-section">
							<h3 style={{ margin: '0 0 16px 0', borderBottom: '2px solid var(--primary)', paddingBottom: 8 }}>ID設定</h3>
							<div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
								<label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
									<input 
										type="checkbox" 
										checked={useCustomId.customer}
										onChange={(e) => setUseCustomId(prev => ({ ...prev, customer: e.target.checked }))}
									/>
									カスタムIDを指定する
								</label>
							</div>
							{useCustomId.customer && (
								<div style={{ marginTop: 16 }}>
																	<FormTextField 
									label="顧客ID（数値）" 
									type="number"
									placeholder="例: 100（自動割り当ては1から開始）"
									{...customerForm.register('customId')} 
									error={customerForm.formState.errors.customId} 
								/>
									<div style={{ fontSize: 14, color: 'var(--muted)', marginTop: 4 }}>
										※ 指定しない場合は自動的にIDが割り当てられます
									</div>
								</div>
							)}
						</div>

						{/* 基本情報セクション */}
						<div className="form-section">
							<h3 style={{ margin: '0 0 16px 0', borderBottom: '2px solid var(--primary)', paddingBottom: 8 }}>基本情報</h3>
							<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
								<FormTextField 
									label="顧客名 *" 
									{...customerForm.register('name')} 
									error={customerForm.formState.errors.name} 
								/>
								<FormTextField 
									label="フリガナ" 
									{...customerForm.register('furigana')} 
									error={customerForm.formState.errors.furigana} 
								/>
							</div>
							<div style={{ marginTop: 16 }}>
								<FormTextField 
									label="会社名・屋号" 
									{...customerForm.register('companyName')} 
									error={customerForm.formState.errors.companyName} 
								/>
							</div>
						</div>

						{/* 住所情報セクション */}
						<div className="form-section">
							<h3 style={{ margin: '0 0 16px 0', borderBottom: '2px solid var(--primary)', paddingBottom: 8 }}>住所情報</h3>
							<div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 16, alignItems: 'end' }}>
								<FormTextField 
									label="郵便番号" 
									placeholder="123-4567"
									{...customerForm.register('postalCode')} 
									error={customerForm.formState.errors.postalCode} 
								/>
								<div></div>
							</div>
							<div style={{ marginTop: 16 }}>
								<FormTextField 
									label="住所1 *" 
									placeholder="都道府県市区町村"
									{...customerForm.register('address1')} 
									error={customerForm.formState.errors.address1} 
								/>
							</div>
							<div style={{ marginTop: 16 }}>
								<FormTextField 
									label="住所2" 
									placeholder="番地・建物名・部屋番号など"
									{...customerForm.register('address2')} 
									error={customerForm.formState.errors.address2} 
								/>
							</div>
						</div>

						{/* 連絡先情報セクション */}
						<div className="form-section">
							<h3 style={{ margin: '0 0 16px 0', borderBottom: '2px solid var(--primary)', paddingBottom: 8 }}>連絡先情報</h3>
							<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
								<FormTextField 
									label="電話番号" 
									placeholder="03-1234-5678"
									{...customerForm.register('phone')} 
									error={customerForm.formState.errors.phone} 
								/>
								<FormTextField 
									label="FAX番号" 
									placeholder="03-1234-5679"
									{...customerForm.register('fax')} 
									error={customerForm.formState.errors.fax} 
								/>
							</div>
							<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
								<FormTextField 
									label="携帯電話" 
									placeholder="090-1234-5678"
									{...customerForm.register('mobile')} 
									error={customerForm.formState.errors.mobile} 
								/>
								<FormTextField 
									label="メールアドレス" 
									type="email"
									placeholder="example@example.com"
									{...customerForm.register('email')} 
									error={customerForm.formState.errors.email} 
								/>
							</div>
						</div>

						{/* 配達・集金情報セクション */}
						<div className="form-section">
							<h3 style={{ margin: '0 0 16px 0', borderBottom: '2px solid var(--primary)', paddingBottom: 8 }}>配達・集金情報</h3>
							<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
								<FormSelect
									label="配達コース"
									{...customerForm.register('deliveryCourseId', { valueAsNumber: true })}
									error={customerForm.formState.errors.deliveryCourseId}
									options={[
										{ value: '', label: '配達コースを選択' },
										...deliveryCourses.map(course => ({ value: course.id, label: course.name }))
									]}
								/>
								<FormSelect
									label="集金方法"
									{...customerForm.register('collectionMethod')}
									error={customerForm.formState.errors.collectionMethod}
									options={[
										{ value: '', label: '集金方法を選択' },
										{ value: 'cash', label: '現金' },
										{ value: 'direct_debit', label: '口座引き落とし' },
										{ value: 'credit', label: 'クレジット払い' }
									]}
								/>
							</div>
						</div>

						{/* 契約情報セクション */}
						<div className="form-section">
							<h3 style={{ margin: '0 0 16px 0', borderBottom: '2px solid var(--primary)', paddingBottom: 8 }}>契約情報</h3>
							<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
								<FormSelect
									label="契約状態"
									{...customerForm.register('contractStatus')}
									error={customerForm.formState.errors.contractStatus}
									options={[
										{ value: 'active', label: '契約中' },
										{ value: 'suspended', label: '休止中' },
										{ value: 'terminated', label: '解約済み' }
									]}
								/>
								<FormTextField 
									label="契約開始日" 
									type="date"
									{...customerForm.register('contractStartDate')} 
									error={customerForm.formState.errors.contractStartDate} 
								/>
							</div>
						</div>

						{/* 営業・紹介情報セクション */}
						<div className="form-section">
							<h3 style={{ margin: '0 0 16px 0', borderBottom: '2px solid var(--primary)', paddingBottom: 8 }}>営業・紹介情報</h3>
							<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
								<FormTextField 
									label="紹介者" 
									{...customerForm.register('referrer')} 
									error={customerForm.formState.errors.referrer} 
								/>
								<FormTextField 
									label="担当営業" 
									{...customerForm.register('salesPerson')} 
									error={customerForm.formState.errors.salesPerson} 
								/>
							</div>
						</div>

						{/* メモセクション */}
						<div className="form-section">
							<h3 style={{ margin: '0 0 16px 0', borderBottom: '2px solid var(--primary)', paddingBottom: 8 }}>メモ・備考</h3>
							<div>
								<label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>メモ</label>
								<textarea 
									{...customerForm.register('memo')}
									style={{ 
										width: '100%', 
										minHeight: 120, 
										padding: 12, 
										border: '1px solid var(--border)', 
										borderRadius: 6,
										resize: 'vertical',
										fontFamily: 'inherit'
									}}
									placeholder="顧客に関する特記事項やメモを入力してください"
								/>
							</div>
						</div>

						{/* 送信ボタン */}
						<div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 16, borderTop: '1px solid var(--border)' }}>
							<button type="button" className="ghost" onClick={() => customerForm.reset()}>
								リセット
							</button>
							<button type="submit" disabled={customerForm.formState.isSubmitting} style={{ minWidth: 120 }}>
								{customerForm.formState.isSubmitting ? '登録中...' : '顧客を登録'}
							</button>
						</div>
					</form>
				</div>
			)}

			{/* メーカー登録フォーム */}
			{activeTab === 'manufacturer' && (
				<form onSubmit={manufacturerForm.handleSubmit(onSubmitManufacturer)} style={{ display: 'grid', gap: 24, maxWidth: 600 }}>
					{/* ID設定セクション */}
					<div className="form-section">
						<h3 style={{ margin: '0 0 16px 0', borderBottom: '2px solid var(--primary)', paddingBottom: 8 }}>ID設定</h3>
						<div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
							<label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
								<input 
									type="checkbox" 
									checked={useCustomId.manufacturer}
									onChange={(e) => setUseCustomId(prev => ({ ...prev, manufacturer: e.target.checked }))}
								/>
								カスタムIDを指定する
							</label>
						</div>
						{useCustomId.manufacturer && (
							<div style={{ marginTop: 16 }}>
								<FormTextField 
									label="メーカーID（数値）" 
									type="number"
									placeholder="例: 100（自動割り当ては1から開始）"
									{...manufacturerForm.register('customId')} 
									error={manufacturerForm.formState.errors.customId} 
								/>
								<div style={{ fontSize: 14, color: 'var(--muted)', marginTop: 4 }}>
									※ 指定しない場合は自動的にIDが割り当てられます
								</div>
							</div>
						)}
					</div>

					<div className="form-section">
						<h3 style={{ margin: '0 0 16px 0', borderBottom: '2px solid var(--primary)', paddingBottom: 8 }}>メーカー情報</h3>
						<FormTextField 
							label="メーカー名" 
							{...manufacturerForm.register('name')} 
							error={manufacturerForm.formState.errors.name} 
						/>
						<FormTextField 
							label="連絡先情報（任意）" 
							{...manufacturerForm.register('contactInfo')} 
							error={manufacturerForm.formState.errors.contactInfo} 
						/>
					</div>

					<div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 16, borderTop: '1px solid var(--border)' }}>
						<button type="button" className="ghost" onClick={() => {
							manufacturerForm.reset();
							setUseCustomId(prev => ({ ...prev, manufacturer: false }));
						}}>
							リセット
						</button>
						<button type="submit" disabled={manufacturerForm.formState.isSubmitting} style={{ minWidth: 120 }}>
							{manufacturerForm.formState.isSubmitting ? '登録中...' : 'メーカーを登録'}
						</button>
					</div>
				</form>
			)}

			{/* 商品登録フォーム */}
			{activeTab === 'product' && (
				<form onSubmit={productForm.handleSubmit(onSubmitProduct)} style={{ display: 'grid', gap: 24, maxWidth: 600 }}>
					{loadingManufacturers && <Loading />}
					
					{/* ID設定セクション */}
					<div className="form-section">
						<h3 style={{ margin: '0 0 16px 0', borderBottom: '2px solid var(--primary)', paddingBottom: 8 }}>ID設定</h3>
						<div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
							<label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
								<input 
									type="checkbox" 
									checked={useCustomId.product}
									onChange={(e) => setUseCustomId(prev => ({ ...prev, product: e.target.checked }))}
								/>
								カスタムIDを指定する
							</label>
						</div>
						{useCustomId.product && (
							<div style={{ marginTop: 16 }}>
								<FormTextField 
									label="商品ID（数値）" 
									type="number"
									placeholder="例: 100（自動割り当ては1から開始）"
									{...productForm.register('customId')} 
									error={productForm.formState.errors.customId} 
								/>
								<div style={{ fontSize: 14, color: 'var(--muted)', marginTop: 4 }}>
									※ 指定しない場合は自動的にIDが割り当てられます
								</div>
							</div>
						)}
					</div>

					<div className="form-section">
						<h3 style={{ margin: '0 0 16px 0', borderBottom: '2px solid var(--primary)', paddingBottom: 8 }}>商品情報</h3>
						<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
							<FormTextField 
								label="商品名" 
								{...productForm.register('name')} 
								error={productForm.formState.errors.name} 
							/>
							<FormSelect
								label="メーカー"
								{...productForm.register('manufacturerId', { valueAsNumber: true })}
								error={productForm.formState.errors.manufacturerId}
								options={[
									{ value: '', label: 'メーカーを選択してください' },
									...manufacturers.map(m => ({ value: m.id, label: m.name }))
								]}
							/>
						</div>
						<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
							<FormNumberField 
								label="価格（円）" 
								{...productForm.register('price', { valueAsNumber: true })} 
								error={productForm.formState.errors.price} 
							/>
							<FormTextField 
								label="単位" 
								placeholder="例: 本, 個, L"
								{...productForm.register('unit')} 
								error={productForm.formState.errors.unit} 
							/>
						</div>
						<div style={{ marginTop: 16 }}>
							<FormTextField 
								label="説明（任意）" 
								{...productForm.register('description')} 
								error={productForm.formState.errors.description} 
							/>
						</div>
						<div style={{ marginTop: 16 }}>
							<FormNumberField 
								label="在庫数（任意）" 
								placeholder="未入力の場合は99999に設定されます"
								{...productForm.register('stock', { valueAsNumber: true })} 
								error={productForm.formState.errors.stock} 
							/>
						</div>
					</div>

					<div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 16, borderTop: '1px solid var(--border)' }}>
						<button type="button" className="ghost" onClick={() => {
							productForm.reset();
							setUseCustomId(prev => ({ ...prev, product: false }));
						}}>
							リセット
						</button>
						<button type="submit" disabled={productForm.formState.isSubmitting} style={{ minWidth: 120 }}>
							{productForm.formState.isSubmitting ? '登録中...' : '商品を登録'}
						</button>
					</div>
				</form>
			)}

			{/* 配達コース登録フォーム */}
			{activeTab === 'course' && (
				<form onSubmit={courseForm.handleSubmit(onSubmitCourse)} style={{ display: 'grid', gap: 24, maxWidth: 600 }}>
					{/* ID設定セクション */}
					<div className="form-section">
						<h3 style={{ margin: '0 0 16px 0', borderBottom: '2px solid var(--primary)', paddingBottom: 8 }}>ID設定</h3>
						<div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
							<label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
								<input 
									type="checkbox" 
									checked={useCustomId.course}
									onChange={(e) => setUseCustomId(prev => ({ ...prev, course: e.target.checked }))}
								/>
								カスタムIDを指定する
							</label>
						</div>
						{useCustomId.course && (
							<div style={{ marginTop: 16 }}>
								<FormTextField 
									label="配達コースID（数値）" 
									type="number"
									placeholder="例: 100（自動割り当ては1から開始）"
									{...courseForm.register('customId')} 
									error={courseForm.formState.errors.customId} 
								/>
								<div style={{ fontSize: 14, color: 'var(--muted)', marginTop: 4 }}>
									※ 指定しない場合は自動的にIDが割り当てられます
								</div>
							</div>
						)}
					</div>

					<div className="form-section">
						<h3 style={{ margin: '0 0 16px 0', borderBottom: '2px solid var(--primary)', paddingBottom: 8 }}>配達コース情報</h3>
						<FormTextField 
							label="コース名" 
							{...courseForm.register('name')} 
							error={courseForm.formState.errors.name} 
						/>
						<div style={{ marginTop: 16 }}>
							<FormTextField 
								label="説明（任意）" 
								{...courseForm.register('description')} 
								error={courseForm.formState.errors.description} 
							/>
						</div>
					</div>

					<div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 16, borderTop: '1px solid var(--border)' }}>
						<button type="button" className="ghost" onClick={() => {
							courseForm.reset();
							setUseCustomId(prev => ({ ...prev, course: false }));
						}}>
							リセット
						</button>
						<button type="submit" disabled={courseForm.formState.isSubmitting} style={{ minWidth: 120 }}>
							{courseForm.formState.isSubmitting ? '登録中...' : '配達コースを登録'}
						</button>
					</div>
				</form>
			)}

			{/* 店舗登録フォーム */}
			{activeTab === 'store' && (
				<form onSubmit={storeForm.handleSubmit(onSubmitStore)} style={{ display: 'grid', gap: 24, maxWidth: 600 }}>
					<div className="form-section">
						<h3 style={{ margin: '0 0 16px 0', borderBottom: '2px solid var(--primary)', paddingBottom: 8 }}>店舗情報</h3>
						<FormTextField 
							label="店舗名" 
							{...storeForm.register('name')}
							error={storeForm.formState.errors.name}
						/>
						<FormTextField 
							label="住所" 
							{...storeForm.register('address')}
							error={storeForm.formState.errors.address}
						/>
						<FormTextField 
							label="電話番号（任意）" 
							{...storeForm.register('phone')}
							error={storeForm.formState.errors.phone as any}
						/>
					</div>

					<div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 16, borderTop: '1px solid var(--border)' }}>
						<button type="button" className="ghost" onClick={() => storeForm.reset()}>
							リセット
						</button>
						<button type="submit" disabled={storeForm.formState.isSubmitting} style={{ minWidth: 120 }}>
							{storeForm.formState.isSubmitting ? '登録中...' : '店舗を登録'}
						</button>
					</div>
				</form>
			)}
		</div>
	);
}
