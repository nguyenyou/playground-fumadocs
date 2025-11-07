package examples.autogen.sjs.example1

import org.scalajs.dom
import com.raquo.laminar.api.L.*
@main def app = {
  val container = dom.document.querySelector("#root")
  render(container, {
    div("Hello, world22222!")
  })
}
