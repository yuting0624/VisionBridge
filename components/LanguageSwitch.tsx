import { Select } from "@chakra-ui/react"
import { useRouter } from "next/router"

const LanguageSwitch = () => {
  const router = useRouter()

  const changeLanguage = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const locale = e.target.value
    router.push(router.pathname, router.asPath, { locale })
  }

  return (
    <Select onChange={changeLanguage} value={router.locale}>
      <option value="ja">日本語</option>
      <option value="en">English</option>
    </Select>
  )
}

export default LanguageSwitch