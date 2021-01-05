const express = require("express");
const router = express.Router();

const util = require("util");
const conexion = require("../dbConnection");
const qy = util.promisify(conexion.query).bind(conexion);

/*
POST '/persona' recibe: {nombre: string, apellido: string, alias: string, email: string} 
retorna: status: 200, {id: numérico, nombre: string, apellido: string, alias: string, email: string}
- status: 413, {mensaje: <descripcion del error>} que puede ser: "faltan datos", "el email ya se
encuentra registrado", "error inesperado"
*/

router.post("/", async (req, res) => {
  try {
    // Valido que me manden correctamente la info
    if (
      !req.body.nombre ||
      !req.body.apellido ||
      !req.body.alias ||
      !req.body.email
    ) {
      throw new Error("Falta enviar datos, todos los datos son requeridos");
    }

    // Verifico que no exista previamente un usuario con el mismo email
    let query = "SELECT id FROM persona WHERE email = ?";

    let respuesta = await qy(query, [req.body.email]);

    if (respuesta.length > 0) {
      throw new Error("El email ya existe");
    }

    // Guardo nuevo usuario
    query =
      "INSERT INTO persona (nombre, apellido, alias, email) VALUE (?,?,?,?)";
    respuesta = await qy(query, [
      req.body.nombre,
      req.body.apellido,
      req.body.alias,
      req.body.email
    ]);
    res.send({ respuesta: respuesta.insertId });
  } catch (e) {
    console.error(e.message);
    res.status(413).send({ Error: e.message });
  }
});

/*
GET '/persona' retorna status 200 y [{id: numérico, nombre: string, apellido: string, 
alias: string, email; string}] o bien status 413 y []*
 */

router.get("/", async (req, res) => {
  try {
    const query = "SELECT * FROM persona";
    const respuesta = await qy(query);
    res.send({ respuesta: respuesta });
  } catch (e) {
    console.error(e.message);
    res.status(413).send({ Error: "Error inesperado" });
  }
});

/*
GET '/persona/:id' retorna status 200 y {id: numérico, nombre: string, apellido: string,
alias: string, email; string} - status 413 , {mensaje: <descripción del error>}
"error inesperado", "no se encuentra esa persona"
 */

router.get("/:id", async (req, res) => {
  try {
    const query = "SELECT * FROM persona WHERE id = ?";

    const respuesta = await qy(query, [req.params.id]);
    console.log(respuesta);

    res.send({ respuesta: respuesta });
  } catch (e) {
    console.error(e.message);
    res.status(413).send({ Error: e.message });
  }
});

/*
 PUT '/persona/:id' recibe: {nombre: string, apellido: string, alias: string, email: string}
 el email no se puede modificar. retorna status 200 y el objeto modificado o bien status 413, 
 {mensaje: <descripción del error>} "error inesperado", "no se encuentra esa persona"
*/

router.put("/:id", async (req, res) => {
  try {
    let query = "SELECT * FROM persona WHERE id = ?";

    //verificando si existe la persona solicitada
    let respuesta = await qy(query, [req.params.id]);
    if (respuesta.length === 0) {
      throw new Error("No se encuentra esa persona");
    }

    query =
      "UPDATE persona SET nombre = ?, apellido = ?, alias = ? WHERE id = ?";
    respuesta = await qy(query, [
      req.body.nombre,
      req.body.apellido,
      req.body.alias,
      req.params.id
    ]);

    if ("email" in req.body) {
      throw new Error("El mail no se puede modificar");
    }

    // Para retornar el objeto modificado con sus respectivos datos
    query = "SELECT * FROM persona WHERE id = ?";
    respuesta = await qy(query, [req.params.id]);

    res.send({ respuesta: respuesta });
  } catch (e) {
    console.error(e.message);
    res.status(413).send({ Error: e.message });
  }
});

/*
DELETE '/persona/:id' retorna: 200 y {mensaje: "se borro correctamente"} o bien 413, 
{mensaje: <descripcion del error>} "error inesperado", "no existe esa persona", "esa 
persona tiene libros asociados, no se puede eliminar"
*/

router.delete("/:id", async (req, res) => {
  try {
    let query = "SELECT * FROM persona WHERE id = ?";

    let respuesta = await qy(query, [req.params.id]);

    // Verificando si el id ingresado pertenece a alguna persona:
    if (respuesta.length === 0) {
      throw new Error("No existe esa persona");
    }

    query = "DELETE FROM persona WHERE id = ?";

    respuesta = await qy(query, [req.params.id]);

    res.send("El usuario con el id ingresado se borró correctamente.");
  } catch (e) {
    console.error(e.message);
    res.status(413).send({ Error: e.message });
  }
});

module.exports = router;