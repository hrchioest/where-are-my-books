const express = require("express");
const router = express.Router();
const conexion = require("./sql");
const util = require("util");

const qy = util.promisify(conexion.query).bind(conexion); // permite el uso de asyn-await en la conexion mysql


// GET '/libro' - Devuelve todos los libros o mensaje de error con status 413.
router.get('/', async (req, res, next) => {
    try{
        const query="SELECT * FROM books";
        const respuesta=await qy(query);
        res.send({"respuesta":respuesta});
    }
    catch(e){
        res.status(413).send({Error:"Error inesperado"});
    }
})

// POST '/libro' - Recibe, nombre y descripcion como string, también recibe categoria_id y persona_id como int
// Verifica que se hayan pasado todos los datos y ademas que la categoria y la persona existan.
router.post('/', async (req, res, next) => {
    try{
        // Verifico que se pasen todos los datos requeridos.
        if(!req.body.nombre || !req.body.descripcion || !req.body.categoria_id || !req.body.persona_id){
            throw new Error("Todos los campos (nombre, descripcion, categoria_id y persona_id son obligatorios")
        }

        // consulto si el id existe en categorias de libros
        let query_cat="SELECT id FROM categories WHERE id=?";
        let respuesta_cat=await qy(query_cat,[req.body.categoria_id]);
        
        // consulto si el id existe en los usuarios o si es null (que nadie tiene asignado el libro)
        let query_user="SELECT id FROM users WHERE id=?";
        let respuesta_user=await qy(query_user,[req.body.persona_id]);
        
        // Verifico primero si el valor de persona_id no es "null" ya que significa que nadie lo tiene reservado.
        // Si no es "null" verifico si la persona que lo tiene reservado existe en la tabla users
        if(req.body.persona_id!="null"){
            if(respuesta_cat.length==0 || respuesta_user.length==0) {
                throw new Error("El id de la categoria o de la persona indicada no existe")            
                }
        }
        // Si todo lo anterior esta correcto se procede al guardado en la DB
        query="INSERT INTO books (nombre, descripcion, categoria_id, persona_id) VALUES (?, ?, ?, ?)";
        respuesta=await qy(query,[req.body.nombre,req.body.descripcion,req.body.categoria_id,req.body.persona_id])
        res.send({"respuesta":respuesta.insertId});
    }
    catch(e){
        res.status(413).send({Error:"Error inesperado - "+e});
    }
})

// GET '/libro/:id' - Requiere el dato especifico del libro por id, verifica que el id ingresado se encuentre en la base de datos.
router.get('/:id', async (req, res, next) => {
    try{
        const query="SELECT * FROM books WHERE id=?";
        const respuesta=await qy(query,[req.params.id]);
        if(respuesta.length==0){
            throw new Error("No se encuentra ese libro") 
        }
        res.send({"respuesta":respuesta});
    }
    catch(e){
        res.status(413).send({Error:"Error inesperado - "+e});
    }
})



// PUT '/libro/prestar/:id' y {id:numero, persona_id:numero} devuelve 200 y {mensaje: "se presto correctamente"} o bien status 413, {mensaje: <descripcion del error>} "error inesperado", "el libro ya se encuentra prestado, no se puede prestar hasta que no se devuelva", "no se encontro el libro", "no se encontro la persona a la que se quiere prestar el libro"

router.put('/prestar/:id', async (req, res, next) => {
    try{
        let query="SELECT * FROM books WHERE id=?";
        let respuesta=await qy(query,[req.params.id]);
        console.log(respuesta)
        
        // consulto si el id existe en los usuarios
        let query_user="SELECT id FROM users WHERE id=?";
        let respuesta_user=await qy(query_user,[req.body.persona_id]);

        if(respuesta.length==0){
            throw new Error("No se encuentra ese libro.") 
        }

        if(respuesta[0].persona_id!=0){
            throw new Error("El libro se encuentra prestado, no se puede prestar hasta que se devuelva.") 
        }

        if(respuesta_user.length==0){
            throw new Error("No se encuentra la persona a la que se quiere prestar el libro.") 
        }

        // Realizo la modificacion.
        query="UPDATE books SET persona_id=? WHERE id=? "
        respuesta=await qy(query,[req.body.persona_id,req.params.id])
        
        // Devuelvo el dato modificado
        query="SELECT * FROM books WHERE id=?";
        respuesta=await qy(query,[req.params.id]);

        res.send({"respuesta":respuesta});
    }
    catch(e){
        res.status(413).send({Error:"Error inesperado - "+e});
    }
})



// PUT '/libro/devolver/:id' y {} devuelve 200 y {mensaje: "se realizo la devolucion correctamente"} o bien status 413, {mensaje: <descripcion del error>} "error inesperado", "ese libro no estaba prestado!", "ese libro no existe"
router.put('/devolver/:id', async (req, res, next) => {
    try{
        // consulto si el libro a devolver existe.
        let query="SELECT * FROM books WHERE id=?";
        let respuesta=await qy(query,[req.params.id]);
        
        if(respuesta.length==0){
            throw new Error("No se encuentra ese libro.") 
        }

        if(respuesta[0].persona_id==0){
            throw new Error("El libro no se encuentra prestado.") 
        }

        // Realizo la modificacion.
        query="UPDATE books SET persona_id=? WHERE id=? "
        respuesta=await qy(query,[0,req.params.id])
        
        // Devuelvo el dato modificado
        query="SELECT * FROM books WHERE id=?";
        respuesta=await qy(query,[req.params.id]);

        res.send({"respuesta":respuesta});
    }
    catch(e){
        res.status(413).send({Error:"Error inesperado - "+e});
    }
})



// PUT '/libro/:id' - Requiere el dato especifico del libro por id, verifica que el id ingresado se encuentre en la base de datos y realiza la modificacion.
router.put('/:id', async (req, res, next) => {
    try{
        let query="SELECT * FROM books WHERE id=?";
        let respuesta=await qy(query,[req.params.id]);
        if(respuesta.length==0){
            throw new Error("No se encuentra ese libro") 
        }

        // Realizo la modificacion.
        query="UPDATE books SET descripcion=? WHERE id=?"
        respuesta=await qy(query,[req.body.descripcion,req.params.id])

        // Devuelvo el dato modificado
        query="SELECT * FROM books WHERE id=?";
        respuesta=await qy(query,[req.params.id]);
        res.send({"respuesta":respuesta});

    }
    catch(e){
        res.status(413).send({Error:"Error inesperado - "+e});
    }

})

// DELETE '/libro/:id'
router.delete('/:id', async (req, res, next) => {
    try{
        let query="SELECT * FROM books WHERE id=?";
        let respuesta=await qy(query,[req.params.id]);
        if(respuesta.length==0){
            throw new Error("No se encuentra ese libro") 
        } 
        console.log(respuesta[0].persona_id);
        if(respuesta[0].persona_id>0){
            throw new Error("El libro se encuentra prestado") 
        }
        
        // Realizo el borrado
        query="DELETE FROM books WHERE id=?"
        respuesta=await qy(query,[req.params.id])
        res.send({"respuesta":respuesta});
    }
    catch(e){
        res.status(413).send({Error:"Error inesperado - "+e});
    }
});

module.exports = router;