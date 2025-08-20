import { z } from 'zod';
import { deliveryCoursesRepository } from '../repositories/deliveryCoursesRepository';

export const deliveryCourseCreateSchema = z.object({
  id: z.number().int().positive().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
});
export const deliveryCourseUpdateSchema = deliveryCourseCreateSchema.partial();

export const deliveryCoursesService = {
  async list() {
    return deliveryCoursesRepository.list();
  },
  async getById(id: number) {
    return deliveryCoursesRepository.getById(id);
  },
  async create(input: unknown) {
    const data = deliveryCourseCreateSchema.parse(input);
    return deliveryCoursesRepository.create(data);
  },
  async update(id: number, input: unknown) {
    const data = deliveryCourseUpdateSchema.parse(input);
    return deliveryCoursesRepository.update(id, data);
  },
  async remove(id: number) {
    const count = await deliveryCoursesRepository.countCustomers(id);
    if (count > 0) {
      const err = new Error('コースに関連する顧客が存在するため削除できません');
      // @ts-ignore add code
      err.code = 'COURSE_HAS_CUSTOMERS';
      throw err;
    }
    await deliveryCoursesRepository.remove(id);
  },
  
  // コース内顧客一覧取得（順番付き）
  async getCourseCustomers(courseId: number) {
    return deliveryCoursesRepository.getCourseCustomers(courseId);
  },
  
  // コース内顧客の順番変更
  async reorderCustomers(courseId: number, customerIds: number[]) {
    return deliveryCoursesRepository.reorderCustomers(courseId, customerIds);
  },
  
  // 顧客のコース間移動
  async transferCustomer(customerId: number, fromCourseId: number, toCourseId: number, position?: number) {
    return deliveryCoursesRepository.transferCustomer(customerId, fromCourseId, toCourseId, position);
  },
};


