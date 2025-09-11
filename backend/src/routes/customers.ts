import { Router } from 'express';
import { customersService } from '../services/customersService';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const { idSearch, nameSearch, phoneSearch, addressSearch, page, pageSize, sortKey, sortDir, all } = req.query;
    const p = Number(page) || 1;
    const ps = Math.min(Number(pageSize) || 10, 100);
    const returnAll = String(all).toLowerCase() === '1' || String(all).toLowerCase() === 'true';
    
    let where: any = {};
    const conditions: any[] = [];
    
    // ID検索
    if (idSearch) {
      const idNum = parseInt(String(idSearch));
      if (!isNaN(idNum)) {
        conditions.push({ id: idNum });
      }
    }
    
    // 名前検索
    if (nameSearch) {
      conditions.push({ name: { contains: String(nameSearch) } });
    }
    
    // 電話番号検索
    if (phoneSearch) {
      conditions.push({ phone: { contains: String(phoneSearch) } });
    }
    
    // 住所検索
    if (addressSearch) {
      conditions.push({ address: { contains: String(addressSearch) } });
    }
    
    // 複数の検索条件がある場合はAND条件で結合
    if (conditions.length > 0) {
      where = { AND: conditions };
    }
    
    const prisma = (await import('../lib/prisma')).default;
    const total = await prisma.customer.count({ where });
    
    // orderByを安全に構築
    let orderBy: any = { id: 'asc' };
    if (sortKey && typeof sortKey === 'string') {
      // 有効なソートキーのみ許可
      const validSortKeys = ['id', 'name', 'address', 'phone', 'email', 'createdAt', 'updatedAt'];
      if (validSortKeys.includes(sortKey)) {
        const direction = String(sortDir) === 'desc' ? 'desc' : 'asc';
        orderBy = { [sortKey]: direction };
      }
    }
    
    const items = await prisma.customer.findMany({
      where,
      orderBy,
      ...(returnAll ? {} : { skip: (p - 1) * ps, take: ps }),
    });
    res.setHeader('X-Total-Count', String(total));
    res.json({ success: true, data: items });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const created = await customersService.create(req.body);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const updated = await customersService.update(id, req.body);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    await customersService.remove(id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;


