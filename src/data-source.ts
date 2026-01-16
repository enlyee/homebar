import 'reflect-metadata'
import { DataSource } from 'typeorm'
import { Cocktail } from './entities/Cocktail'
import { Order } from './entities/Order'

const getDataSourceConfig = () => {
  const databaseUrl = process.env.DATABASE_URL
  
  if (!databaseUrl) {
    const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build'
    
    if (isBuildTime) {
      return {
        type: 'postgres' as const,
        host: 'localhost',
        port: 5432,
        username: 'postgres',
        password: 'postgres',
        database: 'homebar',
        entities: [Cocktail, Order],
        synchronize: false,
        logging: false,
        extra: {
          max: 10,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 2000,
        },
      }
    }
    
    throw new Error('DATABASE_URL is not defined')
  }

  try {
    const url = new URL(databaseUrl.replace('postgresql://', 'http://'))
    
    return {
      type: 'postgres' as const,
      host: url.hostname,
      port: parseInt(url.port) || 5432,
      username: url.username,
      password: url.password,
      database: url.pathname.slice(1).split('?')[0],
      entities: [Cocktail, Order],
      synchronize: true,
      logging: false,
      extra: {
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      },
    }
  } catch (error) {
    console.error('Error parsing DATABASE_URL:', error)
    throw error
  }
}

let dataSource: DataSource | null = null
let initializationPromise: Promise<DataSource> | null = null

export async function getDataSource(): Promise<DataSource> {
  if (dataSource && dataSource.isInitialized) {
    return dataSource
  }

  if (initializationPromise) {
    return initializationPromise
  }

  initializationPromise = (async () => {
    try {
      const config = getDataSourceConfig()
      dataSource = new DataSource(config)
      
      const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build'
      
      if (!isBuildTime && !dataSource.isInitialized) {
        await dataSource.initialize()
      }
      return dataSource
    } catch (error: any) {
      const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build'
      if (isBuildTime) {
        return dataSource || new DataSource(getDataSourceConfig())
      }
      console.error('Error initializing DataSource:', error?.message || error)
      initializationPromise = null
      throw error
    }
  })()

  return initializationPromise
}
