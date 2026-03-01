import { expenseTypesAPI } from '../services/api';

const REQUIRED_TYPES = ['Expenses', 'Food', 'Site', 'Other'];

export async function ensureExpenseTypes(): Promise<void> {
  try {
    const response = await expenseTypesAPI.getAll();
    const existingTypes = response.data.map((t: { name: string }) => t.name);

    for (const typeName of REQUIRED_TYPES) {
      if (!existingTypes.includes(typeName)) {
        await expenseTypesAPI.create({ name: typeName });
        console.log(`✅ Created expense type: ${typeName}`);
      }
    }

    const typesToRemove = response.data.filter(
      (t: { id: number; name: string }) => !REQUIRED_TYPES.includes(t.name),
    );

    for (const type of typesToRemove) {
      await expenseTypesAPI.delete(type.id);
      console.log(`🗑️ Removed extra expense type: ${type.name}`);
    }

    console.log('✅ Expense types verified');
  } catch (error) {
    console.error('❌ Failed to ensure expense types:', error);
  }
}
