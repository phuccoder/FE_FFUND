import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import Categories from '../../features/category'
import { setPageTitle } from '../../features/common/headerSlice'

function InternalPage(){
    const dispatch = useDispatch()

    useEffect(() => {
        dispatch(setPageTitle({ title : "Category"}))
      }, [dispatch])


    return(
        <Categories />
    )
}

export default InternalPage