export class ObjectPool<T extends { active: boolean }> {
  private pool: T[] = [];
  private createFn: () => T;

  constructor(createFn: () => T, initialSize: number = 10) {
    this.createFn = createFn;

    for (let i = 0; i < initialSize; i++) {
      const obj = this.createFn();
      obj.active = false;
      this.pool.push(obj);
    }
  }

  get(): T {
    const inactive = this.pool.find(obj => !obj.active);

    if (inactive) {
      return inactive;
    }

    const newObj = this.createFn();
    this.pool.push(newObj);
    return newObj;
  }

  getAll(): T[] {
    return this.pool;
  }

  getActive(): T[] {
    return this.pool.filter(obj => obj.active);
  }

  forEach(callback: (obj: T) => void): void {
    this.pool.forEach(callback);
  }

  forEachActive(callback: (obj: T) => void): void {
    this.pool.filter(obj => obj.active).forEach(callback);
  }
}
