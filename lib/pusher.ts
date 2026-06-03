import Pusher from 'pusher'

export const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
})

export async function sendNotification(userId: string, data: {
  title: string
  message: string
  type?: string
}) {
  await pusher.trigger(`user-${userId}`, 'notification', data)
}
