import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import UserManager from '../../features/userManger'
import { setPageTitle } from '../../features/common/headerSlice'

function InternalPage(){
    const dispatch = useDispatch()

    useEffect(() => {
        dispatch(setPageTitle({ title : "UserManager"}))
      }, [dispatch])


    return(
        <UserManager />
    )
}

export default InternalPage