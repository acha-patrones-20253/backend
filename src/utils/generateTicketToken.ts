import jwt from 'jsonwebtoken'

interface EventAccess {
  event_access_id: string;
  user_id: string;
}
interface LoadgingAccess {
  lodging_access_id: string;
  user_id: string;
}

export default (props: EventAccess | LoadgingAccess) => {

  let value;

  if (props.hasOwnProperty("event_access_id")) {
    const { event_access_id, user_id } = props as EventAccess;

    value = {
      event_access_id,
      user_id: user_id,
      key: `${user_id}-${event_access_id}`
    }

  } else {
    const { lodging_access_id, user_id } = props as LoadgingAccess;

    value = {
      lodging_access_id,
      user_id: user_id,
      key: `${user_id}-${lodging_access_id}`
    }
  }
  const ticket_token = jwt.sign(value, import.meta.env.TICKETS_KEY_JWT!)

  return ticket_token;
}