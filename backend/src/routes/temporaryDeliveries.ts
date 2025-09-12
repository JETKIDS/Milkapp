import { Router } from 'express';
import { temporaryDeliveriesService, temporaryDeliveryCreateSchema, temporaryDeliveryUpdateSchema } from '../services/temporaryDeliveriesService';

const router = Router();

// テスト用のルート
router.get('/test', (req, res) => {
  res.json({ message: 'Temporary deliveries router is working' });
});

// テスト用のPOSTルート
router.post('/test', (req, res) => {
  res.json({ message: 'Temporary deliveries POST router is working', body: req.body });
});

// 顧客の臨時配達一覧取得（ルート版）
router.get('/', async (req, res) => {
  try {
    console.log('Temporary deliveries route hit:', req.params);
    // URLからcustomerIdを抽出
    const urlParts = req.originalUrl.split('/');
    const customerIdIndex = urlParts.indexOf('customers') + 1;
    const customerId = parseInt(urlParts[customerIdIndex]);
    
    if (isNaN(customerId)) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_CUSTOMER_ID', message: 'Invalid customer ID' } });
    }

    const deliveries = await temporaryDeliveriesService.list(customerId);
    res.json({ success: true, data: deliveries });
  } catch (error) {
    console.error('Error fetching temporary deliveries:', error);
    res.status(500).json({ success: false, error: { code: 'FETCH_FAILED', message: 'Failed to fetch temporary deliveries' } });
  }
});

// 顧客の臨時配達一覧取得（ID指定版）
router.get('/:customerId', async (req, res) => {
  try {
    console.log('Temporary deliveries route hit:', req.params);
    const customerId = parseInt(req.params.customerId);
    if (isNaN(customerId)) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_CUSTOMER_ID', message: 'Invalid customer ID' } });
    }

    const deliveries = await temporaryDeliveriesService.list(customerId);
    res.json({ success: true, data: deliveries });
  } catch (error) {
    console.error('Error fetching temporary deliveries:', error);
    res.status(500).json({ success: false, error: { code: 'FETCH_FAILED', message: 'Failed to fetch temporary deliveries' } });
  }
});

// 臨時配達作成
router.post('/', async (req, res) => {
  try {
    // URLからcustomerIdを抽出
    const urlParts = req.originalUrl.split('/');
    const customerIdIndex = urlParts.indexOf('customers') + 1;
    const customerId = parseInt(urlParts[customerIdIndex]);
    
    if (isNaN(customerId)) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_CUSTOMER_ID', message: 'Invalid customer ID' } });
    }

    const validatedData = temporaryDeliveryCreateSchema.parse({
      ...req.body,
      customerId,
    });

    const delivery = await temporaryDeliveriesService.create(validatedData);
    res.status(201).json({ success: true, data: delivery });
  } catch (error) {
    console.error('Error creating temporary delivery:', error);
    if (error instanceof Error && error.name === 'ZodError') {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Validation error', details: error.message } });
    }
    res.status(500).json({ success: false, error: { code: 'CREATE_FAILED', message: 'Failed to create temporary delivery' } });
  }
});

// 臨時配達更新
router.put('/:id', async (req, res) => {
  try {
    // URLからcustomerIdを抽出
    const urlParts = req.originalUrl.split('/');
    const customerIdIndex = urlParts.indexOf('customers') + 1;
    const customerId = parseInt(urlParts[customerIdIndex]);
    const id = parseInt(req.params.id);
    
    if (isNaN(customerId) || isNaN(id)) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_ID', message: 'Invalid customer ID or delivery ID' } });
    }

    const validatedData = temporaryDeliveryUpdateSchema.parse(req.body);
    const delivery = await temporaryDeliveriesService.update(id, validatedData);
    res.json({ success: true, data: delivery });
  } catch (error) {
    console.error('Error updating temporary delivery:', error);
    if (error instanceof Error && error.name === 'ZodError') {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Validation error', details: error.message } });
    }
    res.status(500).json({ success: false, error: { code: 'UPDATE_FAILED', message: 'Failed to update temporary delivery' } });
  }
});

// 臨時配達削除
router.delete('/:id', async (req, res) => {
  try {
    // URLからcustomerIdを抽出
    const urlParts = req.originalUrl.split('/');
    const customerIdIndex = urlParts.indexOf('customers') + 1;
    const customerId = parseInt(urlParts[customerIdIndex]);
    const id = parseInt(req.params.id);
    
    if (isNaN(customerId) || isNaN(id)) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_ID', message: 'Invalid customer ID or delivery ID' } });
    }

    await temporaryDeliveriesService.remove(id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting temporary delivery:', error);
    res.status(500).json({ success: false, error: { code: 'DELETE_FAILED', message: 'Failed to delete temporary delivery' } });
  }
});

// 特定日付の臨時配達取得
router.get('/by-date/:date', async (req, res) => {
  try {
    // URLからcustomerIdを抽出
    const urlParts = req.originalUrl.split('/');
    const customerIdIndex = urlParts.indexOf('customers') + 1;
    const customerId = parseInt(urlParts[customerIdIndex]);
    const date = req.params.date;
    
    if (isNaN(customerId)) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_CUSTOMER_ID', message: 'Invalid customer ID' } });
    }

    const deliveries = await temporaryDeliveriesService.getByDate(customerId, date);
    res.json({ success: true, data: deliveries });
  } catch (error) {
    console.error('Error fetching temporary deliveries by date:', error);
    res.status(500).json({ success: false, error: { code: 'FETCH_BY_DATE_FAILED', message: 'Failed to fetch temporary deliveries by date' } });
  }
});

export default router;
