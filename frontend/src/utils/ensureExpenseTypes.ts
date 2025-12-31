import { expenseTypesAPI } from '../services/api';

const REQUIRED_TYPES = ['Food', 'Drinks', 'Site', 'Other'];

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

    console.log('✅ Expense types verified');
  } catch (error) {
    console.error('❌ Failed to ensure expense types:', error);
  }
}
