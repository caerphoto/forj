class PagesController < ApplicationController
  def home
      @title = "Home"
  end

  def about
      @title = "About"
      response.headers['Cache-Control'] = 'public, max-age=300'
  end

  def test
      @title = "Test Page"
  end

end
