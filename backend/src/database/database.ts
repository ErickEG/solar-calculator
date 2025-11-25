import knex from 'knex'
import path from 'path'

const db = knex({
  client: 'sqlite3',
  connection: {
    filename: path.join(__dirname, '../../database.sqlite')
  },
  useNullAsDefault: true
})

export async function initializeDatabase() {
  // Crear tabla solar_panels
  const panelsExists = await db.schema.hasTable('solar_panels')
  if (!panelsExists) {
    await db.schema.createTable('solar_panels', table => {
      table.string('id').primary()
      table.string('brand').notNullable()
      table.string('model').notNullable()
      table.integer('power').notNullable()
      table.decimal('price', 10, 2).notNullable()
      table.decimal('efficiency', 5, 2).notNullable()
      table.decimal('voltage', 8, 2).notNullable()
      table.decimal('current', 8, 2).notNullable()
      table.integer('length').notNullable()
      table.integer('width').notNullable()
      table.integer('thickness').notNullable()
      table.integer('warranty').notNullable()
      table.string('technology').notNullable()
      table.text('certification')
      table.boolean('isActive').defaultTo(true)
      table.timestamps(true, true)
    })
    console.log('Tabla solar_panels creada')
  }

  // Crear tabla inverters
  const invertersExists = await db.schema.hasTable('inverters')
  if (!invertersExists) {
    await db.schema.createTable('inverters', table => {
      table.string('id').primary()
      table.string('brand').notNullable()
      table.string('model').notNullable()
      table.integer('power').notNullable()
      table.decimal('price', 10, 2).notNullable()
      table.string('type').notNullable()
      table.integer('minVoltage').notNullable()
      table.integer('maxVoltage').notNullable()
      table.decimal('efficiency', 5, 2).notNullable()
      table.integer('warranty').notNullable()
      table.integer('mpptChannels').notNullable()
      table.text('certification')
      table.boolean('isActive').defaultTo(true)
      table.timestamps(true, true)
    })
    console.log('Tabla inverters creada')
  }

  // Insertar datos iniciales
  await seedInitialData()
}

async function seedInitialData() {
  const panelCount = await db('solar_panels').count('id as count').first()
  
  if (Number(panelCount?.count) === 0) {
    await db('solar_panels').insert([
      {
        id: 'cs-400p',
        brand: 'Canadian Solar',
        model: 'CS3W-400P',
        power: 400,
        price: 120,
        efficiency: 20.5,
        voltage: 40.9,
        current: 9.78,
        length: 2008,
        width: 1002,
        thickness: 35,
        warranty: 25,
        technology: 'Monocristalino',
        certification: 'IEC 61215, IEC 61730',
        isActive: true
      },
      {
        id: 'jk-420n',
        brand: 'Jinko Solar',
        model: 'JKM420N-54HL4-B',
        power: 420,
        price: 125,
        efficiency: 21.2,
        voltage: 40.6,
        current: 10.34,
        length: 2008,
        width: 1002,
        thickness: 35,
        warranty: 25,
        technology: 'Monocristalino',
        certification: 'IEC 61215, IEC 61730, UL 1703',
        isActive: true
      }
    ])
    console.log('Datos iniciales de paneles insertados')
  }

  const inverterCount = await db('inverters').count('id as count').first()
  
  if (Number(inverterCount?.count) === 0) {
    await db('inverters').insert([
      {
        id: 'sma-3000tl',
        brand: 'SMA',
        model: 'SB 3000TL',
        power: 3000,
        price: 450,
        type: 'string',
        minVoltage: 125,
        maxVoltage: 750,
        efficiency: 96.8,
        warranty: 10,
        mpptChannels: 2,
        certification: 'IEC 62109-1, IEC 62109-2',
        isActive: true
      },
      {
        id: 'fronius-5000',
        brand: 'Fronius',
        model: 'Primo 5.0-1',
        power: 5000,
        price: 650,
        type: 'string',
        minVoltage: 80,
        maxVoltage: 800,
        efficiency: 96.8,
        warranty: 10,
        mpptChannels: 2,
        certification: 'IEC 62109-1, IEC 62109-2',
        isActive: true
      }
    ])
    console.log('Datos iniciales de inversores insertados')
  }
}

export default db
