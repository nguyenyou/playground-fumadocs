package demos.hello

import org.scalajs.dom
import com.raquo.laminar.api.L.*

@main def hello = {
  val container = dom.document.querySelector("#root")
  render(container, App()())
}
