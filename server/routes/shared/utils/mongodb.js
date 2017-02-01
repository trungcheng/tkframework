import { v4 } from 'uuid'
import fse from 'fs-extra'
import path from 'path'
import { filePath } from 'config/constants'
import { decodeBase64Image } from 'data/decoder/image'
import authorize from 'passport/authorize'

export const getPagingRouter =  (model, fields, where, order) => async (req, res)=> {
  const {page=1, limit=10} = req.query  
  const maxLimit = Math.min(+limit, 10)
  const offset = (page-1) * limit
  const options = {
    limit: maxLimit,
    offset,
    fields,    
  }

  if(typeof fields !== 'string')
    options.fields = options.fields.join(' ')
  
  if(where){
    options.where = typeof where === 'function' ? where(req) : where
  }
  if(order){
    options.order = typeof order === 'function' ? order(req) : order
  }
  const count = await model.count(options.where)
  const rows = await model.find(options.where).select(fields).limit(options.limit).skip(options.offset).sort(options.order)
  res.send({rows, count, offset})      
}

export const getDetailRouter = (model, attributes, include=[]) => async (req, res) => {
  // tag is public
  const {id} = req.params
  const options = {fields:(typeof fields !== 'string') ? fields.join(' ') : fields}
  const item = await model.findById(id).select(options.fields)
  res.send(item)  
}

export const getDeleteRouter = (model) => (req, res) => {
  authorize(req)
  const {id} = req.params
  model.destroy({
    where:{id}
  })
  .then(deletedNumber => res.send({deletedNumber}))
}

export const uploadImage = (field, folder, setter, clear=true) => {
  const imageDecode = decodeBase64Image(field)
  // delete old one
  if(imageDecode.buffer) {
    const imagePath = path.join(filePath, folder)
    // delete folder, by default we treat the whole folder like a collection of files, including thumb.v..v
    // for later
    clear && fse.removeSync(imagePath)   
    // update new image
    const filename = v4() + '.png'  
    // must save done then return   
    fse.outputFileSync(path.join(imagePath, filename), imageDecode.buffer)    
    // return file upload path ? not always return, so use setter method
    const imageURL = `/uploads/${folder}/${filename}`
    setter && setter(imageURL) 
    return imageURL
  }  
  // return by default
  return field
  
}