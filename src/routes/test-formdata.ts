import { Hono } from 'hono'

const testRoutes = new Hono()

testRoutes.get('/test-formdata', async (c) => {
  try {
    // Direct FormData test
    const testFormInstance = new FormData()
    testFormInstance.append('test', 'value')
    
    return c.json({
      success: true,
      message: 'FormData works!',
      formDataType: typeof FormData,
      instanceTest: testFormInstance instanceof FormData
    })
  } catch (error: any) {
    return c.json({
      success: false,
      error: error.message,
      errorName: error.name,
      errorStack: error.stack
    }, 500)
  }
})

export default testRoutes
