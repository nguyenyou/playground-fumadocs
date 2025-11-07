package examples.autogen.react.example1

import org.scalajs.dom
import com.raquo.laminar.api.L.*
@main def app = {
  val container = dom.document.querySelector("#root")
  render(container, {
    import scala.scalajs.js
    import scala.scalajs.js.annotation.JSImport
    
    object clsxMod {
      @js.native
      @JSImport("clsx", "clsx")
      def clsx(x: String): String = js.native
    }
    
    val y = clsxMod.clsx("flex items-center justify-center")
    println(y)
    
    div(y, "Hello, React!")
  })
}
