import express, { Request, Response } from 'express'
import cors from 'cors'
import { TVideoDB, TVideoDBpost } from './types'
import { db } from './database/knex'
import { Video } from "./models/Video"
import { VideoPost } from "./models/VideoPost"

const app = express()

app.use(cors())
app.use(express.json())

app.listen(3003, () => {
    console.log(`Servidor rodando na porta ${3003}`)
})

app.get("/ping", async (req: Request, res: Response) => {
    try {
        res.status(200).send({ message: "Pong!" })
    } catch (error) {
        console.log(error)

        if (req.statusCode === 200) {
            res.status(500)
        }

        if (error instanceof Error) {
            res.send(error.message)
        } else {
            res.send("Erro inesperado")
        }
    }
})

app.get("/videos/", async (req: Request, res: Response) => {
    try {
        const q = req.query.q

        let videosDB

        if (q) {
            const result: TVideoDB[] = await db("videos").where("title", "LIKE", `%${q}%`)
            videosDB = result
        } else {
            const result: TVideoDB[] = await db("videos")
            videosDB = result
        }

        const videos: Video[] = videosDB.map((videoDB) =>
            new Video(
                videoDB.id,
                videoDB.title,
                videoDB.duration,
                videoDB.uploaded_at
            )

        )
        res.status(200).send(videos)
    } catch (error) {
        console.log(error)

        if (req.statusCode === 200) {
            res.status(500)
        }

        if (error instanceof Error) {
            res.send(error.message)
        } else {
            res.send("Erro inesperado")
        }
    }
})

app.post("/videos", async (req: Request, res: Response) => {
    try {
        const { id, title, duration } = req.body

        if (id !== undefined) {
            if (typeof id !== "string") {
                res.status(400)
                throw new Error("'id' deve ser string")
            }
        }

        if (title !== undefined) {
            if (typeof title !== "string") {
                res.status(400)
                throw new Error("'title' deve ser string")
            }
        }

        if (duration !== undefined) {
            if (typeof duration !== "string") {
                res.status(400)
                throw new Error("'duration' deve ser string")
            }
        }

        const [videoDBExist]: TVideoDB[] | undefined[] = await db("videos").where({ id })

        if (videoDBExist) {
            res.status(400)
            throw new Error("'id' já existe")
        }

        const newVideo = new VideoPost(
            id,
            title,
            duration,
            new Date().toISOString()
        )

        const newVideoDB: TVideoDB = {

            id: newVideo.getId(),
            title: newVideo.getTitle(),
            duration: newVideo.getDuration(),
            uploaded_at: newVideo.getUploadedAt()
        }

        await db("videos").insert(newVideoDB)
        const [videoDB]: TVideoDB[] = await db("videos").where({ id })

        const response = {
            message: "Vídeo adicionado!",
            newVideo
        }
        res.status(201).send(response)
    } catch (error) {
        console.log(error)

        if (req.statusCode === 200) {
            res.status(500)
        }

        if (error instanceof Error) {
            res.send(error.message)
        } else {
            res.send("Erro inesperado")
        }
    }
})

app.put("/videos/:id", async (req: Request, res: Response) => {
    try {
        const idToEdit = req.params.id

        const newId = req.body.id
        const newTitle = req.body.title
        const newDuration = req.body.duration

        if (idToEdit !== undefined) {
            if (typeof idToEdit !== "string") {
                res.status(400)
                throw new Error("'id' deve ser string")
            }
        }

        if (newTitle !== undefined) {
            if (typeof newTitle !== "string") {
                res.status(400)
                throw new Error("'Title' deve ser string")
            }
        }

        if (newDuration !== undefined) {
            if (typeof newDuration !== "string") {
                res.status(400)
                throw new Error("'newDuration' deve ser string")
            }
        }

        const [videoDB]: TVideoDB[] | undefined[] = await db("videos").where({ id: idToEdit })

        const videoToEdit = new Video(
            newId,
            newTitle,
            newDuration,
            new Date().toISOString()
        )

        const newVideoDB = {
            id: videoToEdit.getId(),
            title: videoToEdit.getTitle(),
            duration: videoToEdit.getDuration(),
            uploaded_at: videoToEdit.getUploadedAt(),
        }

        if (videoDB) {
            const updatedVideo = {
                id: newVideoDB.id || videoDB.id,
                title: newVideoDB.title || videoDB.title,
                duration: newVideoDB.duration || videoDB.duration,
                uploaded_at: videoToEdit.getUploadedAt() || videoDB.uploaded_at
            }
            await db("videos")
                .update(updatedVideo)
                .where({ id: idToEdit })
        } else {
            res.status(404)
            throw new Error("Invalid ID, try again!")
        }

    } catch (error) {
        console.log(error)

        if (req.statusCode === 200) {
            res.status(500)
        }

        if (error instanceof Error) {
            res.send(error.message)
        } else {
            res.send("Erro inesperado")
        }
    }
})

app.delete("/videos/:id", async (req: Request, res: Response) => {
    try {
        const idToDelete = req.params.id

        if (typeof idToDelete !== "string") {
            res.status(400)
            throw new Error("'id' deve ser string")
        }

        const [ videoExists ] = await db("videos").where({ id: idToDelete })

        if (videoExists) {
                await db("videos")
                .del()
                .where({ id: idToDelete })
        } else {
            res.status(404)
            throw new Error("'id' inválida!")
        }

        res.status(201).send("Video deletado com sucesso!")
    } catch (error) {
        console.log(error)

        if (req.statusCode === 200) {
            res.status(500)
        }

        if (error instanceof Error) {
            res.send(error.message)
        } else {
            res.send("Erro inesperado")
        }
    }
})